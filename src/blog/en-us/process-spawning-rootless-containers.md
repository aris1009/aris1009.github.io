---
layout: article.njk
title: "Process Spawning in Rootless Containers: Three Permission Systems, One Misleading Error"
description: "When Bun.spawn() fails with EACCES inside a rootless Podman container, the error names a binary but the real failure is elsewhere. Three independent permission systems interact, and diagnosing the wrong one wastes hours."
date: 2026-05-03
keywords: ["rootless containers", "podman", "selinux", "posix_spawn", "user namespaces", "EACCES", "bun", "container permissions", "linux permissions", "DAC MAC", "quadlet", "systemd"]
tags: ["containers", "linux", "security", "podman", "selinux", "rootless-containers", "devops"]
difficulty: advanced
contentType: deep-dive
technologies: ["podman", "bun", "selinux", "linux"]
type: article
locale: en-us
permalink: /blog/en-us/process-spawning-rootless-containers/
---

The error was unambiguous. It named a binary, a syscall, and an error code:

```
EACCES: permission denied, posix_spawn '/bin/echo'
    path: "/bin/echo",
 syscall: "posix_spawn",
   errno: -13,
    code: "EACCES"
```

So I checked the binary:

```bash
$ podman exec systemd-claude-runner-api ls -la /usr/local/bin/bun
-rwxr-xr-x. 1 root root 99651952 Apr  9 06:07 /usr/local/bin/bun
```

755 permissions. World-executable. The container user was `runner` (uid 1001). There was no reason this should fail. But it happened for every binary I tried, including `/usr/local/bin/bun`, the exact same process already running the server.

That last detail is the tell. A running process cannot fail to execute itself unless the error is not about execution at all.

## Why posix_spawn reports the wrong thing

{% dictionaryLink "posix_spawn", "posix-spawn" %} is not a single syscall. It is an abstraction around a sequence: set working directory, configure resource limits, manage file descriptors, then execute the binary via `execve`. Any failure in that sequence surfaces as the same `EACCES` on the binary path, because the path is the only thing your code passed in, the only concrete thing the abstraction has to name.

The kernel distinguishes between `EACCES` from `execve` (the binary can't be executed) and `EACCES` from `chdir` (a directory in the path can't be traversed). The runtime's error handler collapses both into one message. So `posix_spawn '/bin/echo'` does not mean `/bin/echo` is the problem· it means the spawn sequence failed, and `/bin/echo` was what you asked to spawn.

The fix for an execution permission failure is completely different from the fix for a directory traversal failure. The error message points at the wrong layer. Diagnosing the real failure requires working through three independent systems, each of which can veto a spawn with the same symptom.

## Layer 1: DAC and the invisible chdir

{% dictionaryLink "Discretionary access control", "dac" %} is the familiar file-permission model: owner, group, world, with read/write/execute bits. Most container permission issues start here, and most diagnostics stop here: check the binary, check the user, check the bits.

But this case had a subtler DAC failure deeper in the path.

Bun's spawn implementation calls `chdir()` to the working directory in the child process before calling `execve()`. When you call `Bun.spawn(["cmd"])` without a `cwd` option, it defaults to the current process's working directory, whatever `top_level_dir` the Bun VM was initialized with. The `oven/bun:slim` image sets `WORKDIR /home/bun/app`. That directory sits inside `/home/bun`, which is owned by `bun` (uid 1000) with mode 700. A different user (like `runner` at uid 1001) cannot traverse it, so the `chdir` fails with `EACCES`.

The binary is never reached· the error fires at the path traversal, reported as if it were an execution failure.

Three commands prove it:

```bash
# Direct exec — no chdir involved — works:
$ podman run --rm --user 1001:1001 oven/bun:slim /bin/echo test
test

# Bun.spawn — implicit chdir to /home/bun/app — fails:
$ podman run --rm --user 1001:1001 oven/bun:slim bun -e "Bun.spawn(['/bin/echo','test'])"
EACCES: permission denied, posix_spawn '/bin/echo'

# Bun.spawn with explicit cwd — works:
$ podman run --rm --user 1001:1001 oven/bun:slim bun -e "Bun.spawn(['/bin/echo','test'],{cwd:'/tmp'})"
# (no error)
```

Same binary, same user, identical arguments. Different outcome depending on whether the spawn includes an implicit `chdir`.

The fix: add `WORKDIR /home/runner` to the Dockerfile after the `USER runner` directive. The process starts with a working directory its user can actually traverse.

```dockerfile
USER runner
WORKDIR /home/runner
```

The diagnostic rule that falls out: when you see `posix_spawn EACCES`, check the binary, but also check every parent directory in the working directory path. `ls -la` on the binary is only half the picture.

> **Note:** Two common suspects can be ruled out quickly. `NoNewPrivileges=true` in the Quadlet doesn't affect `chdir`· removing it and redeploying produces the same error. {% dictionaryLink "Seccomp", "seccomp" %} is also not the culprit: if seccomp blocked `execve` or `vfork`, the parent process itself wouldn't start· a running server rules out seccomp.

## Layer 2: SELinux MCS labels and the :Z trap

{% dictionaryLink "SELinux", "selinux" %} is a {% dictionaryLink "mandatory access control", "mac" %} system that runs underneath DAC. A process can have full DAC permission on a file and still be denied by SELinux. After fixing the DAC issue, this can produce a second `EACCES` that looks identical to the first, unless you check `ausearch -m avc`.

The confusion around Podman's `:Z` and `:z` volume labels is itself a trap.

When you mount a host directory into a container, the files carry their host SELinux context. Containers with confined SELinux domains may be denied access if the context doesn't match what the policy expects. `:z` (lowercase) applies the shared `container_file_t` type, making files accessible to any container. `:Z` (uppercase) applies an exclusive {% dictionaryLink "MCS label", "mcs-label" %} to the volume, restricting access to one specific container.

Both are legitimate for their use cases· the problem is that `:Z` interacts destructively with `--userns=keep-id`.

When `:Z` is used alongside `--userns=keep-id`, Podman's relabeling pass over the volume runs in a shifted uid context. Files originally owned by the host user at uid 1000 end up owned by a subuid in the 500000+ range. From the host:

```bash
$ sudo stat -c '%u:%g %n' /home/keep/.claude
525288:525288 /home/keep/.claude
```

Those files are now inaccessible to the original host user and to any other container expecting them at uid 1000. The operation is destructive and not reversible without `chown`.

`:z` avoids the problem. It applies the shared type without assigning an exclusive MCS category and does not shift ownership:

| Label | SELinux effect | Ownership effect | Use case |
|-------|---------------|-----------------|----------|
| `:Z` | Exclusive MCS category | Shifts ownership with userns | Single container, no userns |
| `:z` | Shared `container_file_t` | No ownership shift | Multiple containers or userns |
| (none) | Inherits host context | No change | May cause SELinux denials |

The fix: use `:z` in the Quadlet, then restore what `:Z` shifted:

```ini
Volume=/home/keep/.claude:/home/bun/.claude:z
Volume=/home/keep/.claude.json:/home/bun/.claude.json:z
```

```bash
sudo chown -R 1000:1000 /home/keep/.claude /home/keep/.claude.json
```

The `:Z` / `:z` distinction is documented. The destructive interaction with `--userns=keep-id` is not prominently noted. It is the kind of thing you discover after `sudo stat` shows ownership you didn't set.

## Layer 3: User namespaces and the identity gap

Both DAC and SELinux operate on uid and gid values. {% dictionaryLink "User namespaces", "user-namespace" %} add a translation layer between host uids and container uids, which means the same file can appear owned by different users depending on where you look.

Rootless Podman maps a range of host subuid values to container uid space. Without `--userns=keep-id`, the default mapping looks like this:

```
# cat /proc/self/uid_map  (inside the container)
         0          1       1000    # container 0–999 → host 1–1000
      1000          0          1    # container 1000 → host 0
      1001       1001      64536    # container 1001+ → host 1001+
```

Notice what happens to host uid 1000: the first range maps host uids 1–1000 to container uids 0–999, so host uid 1000 lands at container uid 999. A file owned by host user `keep` (uid 1000) appears inside the container owned by uid 999. If your container has a user at uid 1000, like `bun` in `oven/bun:slim`, that user does not own those files, even though by name they should.

`--userns=keep-id` changes this. It maps host uid 1000 to container uid 1000, so files mounted from the host user appear with the expected ownership inside the container.

The final Quadlet:

```ini
[Container]
Image=localhost/claude-runner-api:latest
Volume=/home/keep/.claude:/home/bun/.claude:z
Volume=/home/keep/.claude.json:/home/bun/.claude.json:z
PodmanArgs=--userns=keep-id --stop-timeout=10
Network=n8n.network
```

There is one more wrinkle at this layer. The `oven/bun:slim` image stores `.bun` under `/root`, which has mode 700. The `bun` user can't traverse it· this is the same DAC path traversal problem from Layer 1, now affecting the Bun toolchain itself. The Dockerfile relocates it:

```dockerfile
FROM claude-runner

RUN cp -a /root/.bun /opt/bun && \
    ln -sf /opt/bun/install/global/node_modules/@anthropic-ai/claude-code/cli.js /usr/local/bin/claude

COPY server.ts /app/server.ts

ENV HOME=/home/bun
USER bun
WORKDIR /home/bun

EXPOSE 3000
ENTRYPOINT ["bun", "run", "/app/server.ts"]
```

The pattern repeats because it's structural. Any time a file is owned by one uid and accessed by another, every directory in the path needs to be traversable by the accessing uid. The error message doesn't tell you this· it tells you what you asked to spawn.

## The diagnostic order

When `posix_spawn` returns `EACCES` in a rootless container, the three layers give you a structured search space. The order matters because each layer requires a different fix, and applying the right fix to the wrong layer does nothing.

**DAC first.** Run `ls -la` on the binary. Also run it on the working directory and every parent in that path. Run `id` inside the container to confirm the actual uid. If you changed `USER` in the Dockerfile, verify the `WORKDIR` is accessible by that user.

**SELinux second.** Run `ls -laZ` on mounted files to inspect their SELinux context. Run `ausearch -m avc -ts recent` to check for denials. Review which volume label you applied and whether `--userns=keep-id` is in play. If you used `:Z` with userns, assume ownership shifted and check with `stat` from the host.

**User namespace last.** Run `cat /proc/self/uid_map` inside the container. Trace how your host file uids translate to container uids. Use `--userns=keep-id` when the host user and container user should share a uid.

This analysis used Bun, which always calls `chdir()` before `execve()`. That behavior is runtime-specific. Node.js, Python, and Go have different spawn implementations with different defaults. The three-layer model applies regardless· the specific trigger for the Layer 1 failure depends on what your runtime does before `execve`. When debugging a different runtime, isolate the binary first with a direct `podman exec` call· it bypasses the runtime's spawn sequence entirely. If direct exec works and spawning from the runtime fails, the failure is in the sequence, not in the binary.

## Further reading

- {% externalLink "Bun.spawn() API documentation", "https://bun.sh/docs/api/spawn" %} - Covers the `cwd` option and working directory defaults
- {% externalLink "Podman volume options", "https://docs.podman.io/en/latest/markdown/podman-run.1.html" %} - The `:z`, `:Z`, and other SELinux label options for bind mounts
- {% externalLink "Linux user_namespaces(7)", "https://man7.org/linux/man-pages/man7/user_namespaces.7.html" %} - Kernel documentation for uid/gid mapping semantics in user namespaces
