---
layout: article.njk
title: "Process Spawning in Rootless Containers: Three Permission Systems, One Misleading Error"
description: "When Bun.spawn() returns EACCES inside a rootless Podman container, the binary permissions are fine. The problem is three independent security layers — POSIX DAC, SELinux MAC, and user namespace UID mapping — each capable of producing the same error and requiring a completely different fix."
date: 2026-04-28
keywords:
  - rootless containers
  - podman
  - SELinux
  - user namespaces
  - POSIX permissions
  - process spawning
  - EACCES
  - container security
  - bun runtime
  - systemd quadlet
tags:
  - linux
  - containers
  - security
  - podman
  - selinux
  - debugging
  - bun
difficulty: advanced
contentType: explanation
technologies: ["podman", "bun", "selinux"]
type: article
locale: en-us
draft: false
permalink: /blog/en-us/process-spawning-rootless-containers/
---

`EACCES: permission denied, posix_spawn '/bin/echo'` is one of the more misleading errors you'll see inside a container. The binary has 755 permissions. The container user is correct. Direct execution through `podman exec` works. But `Bun.spawn()` fails for every binary, every time, and the error message names the binary as if that's where the problem is.

It isn't.

What's happening is three independent permission systems stacking on top of each other, each capable of producing the same `EACCES`, each requiring a completely different fix. Diagnosing at the wrong layer doesn't just waste time; the fix for a POSIX DAC problem is orthogonal to the fix for a user namespace problem even though the surface error is identical.

## TL;DR

Three systems interact when an HTTP service inside a rootless Podman container spawns child processes:

1. **POSIX DAC** · file ownership and mode bits on binaries and directories. A 700 parent directory blocks `chdir()` even when the binary itself is 755.
2. **SELinux MAC** · MCS category labels on mounted volumes. The `:Z` option applies an exclusive label that can shift file ownership on the host when combined with user namespace remapping.
3. **User namespace UID mapping** · rootless Podman remaps UIDs between host and container. Host uid 1000 is not necessarily container uid 1000 by default.

The central insight: `posix_spawn EACCES` does not mean the binary is unexecutable. It means something in the spawn sequence — which includes `chdir()`, resource limit setup, file descriptor management, and finally `execve()` — failed first. The binary named in the error may never have been reached.

---

## The Setup

The environment is a Bun HTTP server inside a rootless Podman container on Fedora 43 with SELinux enforcing. The container is defined by a systemd Quadlet `.container` file, runs as a non-root user (`runner`, uid 1001), and mounts credential files from the host via Podman volumes.

The base image is `oven/bun:slim`· Debian-based, with a `bun` user at uid 1000 and `WORKDIR /home/bun/app`. The server uses `Bun.spawn()` to launch a child process on each request:

```typescript
const proc = Bun.spawn(["claude", "-p", prompt, "--dangerously-skip-permissions"], {
  stdout: "pipe",
  stderr: "pipe",
  env: { ...Bun.env },
});
```

Three distinct issues surfaced during deployment. Each looked like a permission error. Each had a different cause.

## Layer 1: POSIX DAC — The Hidden chdir

### How the spawn sequence fails before touching the binary

The first failure:

```
EACCES: permission denied, posix_spawn '/bin/echo'
    path: "/bin/echo",
 syscall: "posix_spawn",
   errno: -13,
    code: "EACCES"
```

The natural suspects are binary permissions, `NoNewPrivileges`, and the {% dictionaryLink "seccomp", "seccomp" %} profile. All three are wrong.

`/bin/echo` has 755 permissions — `runner` can execute it. The parent Bun process is already running inside the container, which proves the {% dictionaryLink "seccomp", "seccomp" %} profile allows `execve` and `vfork`; if seccomp blocked process spawning, the server itself wouldn't start. SELinux denials appear in `ausearch -m avc`; this error is at the POSIX level, not the MAC level.

The actual cause is in Bun's spawn implementation. {% externalLink "Bun's process spawning", "https://bun.com/docs/runtime/child-process" %} always calls `chdir()` to the working directory before `execve()`, even when no `cwd` option is passed. The default is always the current process's working directory, sourced from `jsc_vm.transpiler.fs.top_level_dir` in Bun's internals.

`oven/bun:slim` sets `WORKDIR /home/bun/app`. The parent directory `/home/bun` has mode **700**, owned by `bun` (uid 1000). A container process running as `runner` (uid 1001) cannot traverse `/home/bun`, so `chdir("/home/bun/app")` fails with EACCES. The binary path is never reached.

The evidence is clean:

```bash
# Direct exec — no chdir involved; works
podman run --rm --user 1001:1001 oven/bun:slim /bin/echo test

# Bun.spawn — implicit chdir to /home/bun/app; fails
podman run --rm --user 1001:1001 oven/bun:slim bun -e "Bun.spawn(['/bin/echo','test'])"

# Bun.spawn with explicit cwd; works
podman run --rm --user 1001:1001 oven/bun:slim bun -e "Bun.spawn(['/bin/echo','test'],{cwd:'/tmp'})"

# Correct WORKDIR in image; works
podman run --rm --user 1001:1001 --workdir /tmp oven/bun:slim bun -e "Bun.spawn(['/bin/echo','test'])"
```

The fix is `WORKDIR /home/runner` in the Dockerfile, placed after `USER runner`:

```dockerfile
USER runner
WORKDIR /home/runner
```

This is a {% dictionaryLink "POSIX DAC", "posix-dac" %} (Discretionary Access Control) failure. The mode bits on a parent directory blocked the spawn sequence at the `chdir()` step. The error message named the binary; the problem was the directory above the working directory. These are genuinely different things, and the stack trace gives no indication of the distinction.

## Layer 2: SELinux — :Z Is Not Just an Uppercase :z

### What happens when volume relabeling shifts file ownership

With the WORKDIR corrected, the runner user still can't access credential files mounted from the host:

```bash
$ podman exec --user runner systemd-claude-runner-api ls -la /home/runner/.claude/
ls: cannot open directory '/home/runner/.claude/': Permission denied
```

Checking from the host reveals something unexpected:

```bash
$ sudo stat -c '%u:%g %n' /home/keep/.claude
525288:525288 /home/keep/.claude
```

The files are now owned by uid **525288** — a subuid in Podman's user namespace range. They were originally owned by `keep:1000`.

The Quadlet was using `:Z` (uppercase):

```ini
Volume=/home/keep/.claude:/home/runner/.claude:Z
Volume=/home/keep/.claude.json:/home/runner/.claude.json:Z
```

The `:Z` option tells Podman to apply an exclusive {% dictionaryLink "MCS label", "mcs-label" %} to the volume. Each container process gets a unique category pair like `c123,c456`; the volume context is set to `system_u:object_r:container_file_t:s0:c123,c456`, which prevents any other container from reading it. This is correct behavior for private data on a single dedicated container.

The ownership shift is a side effect of how relabeling interacts with the active user namespace. When Podman relabels the host directory while a user namespace mapping is in effect, the ownership written to the inode reflects the mapped UID rather than the original host UID. The files end up owned by the subuid (525288) instead of `keep` (1000). This is destructive: the original container that also expected these files now finds them owned by a uid it doesn't recognize.

`:z` (lowercase) behaves differently. It sets the `container_file_t` type with a shared MCS category, allowing multiple containers access. It does not shift file ownership.

| Label | SELinux effect | Ownership side effect |
|-------|---------------|----------------------|
| `:Z` | Exclusive MCS category, private to this container | Can shift ownership with active userns |
| `:z` | Shared `container_file_t`, multiple containers | No ownership change |
| (none) | Inherits host context | May cause SELinux AVC denials |

The fix: switch to `:z` in the Quadlet, then restore the shifted ownership on the host:

```ini
Volume=/home/keep/.claude:/home/bun/.claude:z
Volume=/home/keep/.claude.json:/home/bun/.claude.json:z
```

```bash
sudo chown -R 1000:1000 /home/keep/.claude /home/keep/.claude.json
```

{% externalLink "Red Hat's guide on SELinux container labeling", "https://developers.redhat.com/articles/2025/04/11/my-advice-selinux-container-labeling" %} covers when `:Z` is appropriate — primarily single-container use cases on systems without `--userns` mapping. With rootless Podman and user namespace modes active, `:z` is almost always the safer default for bind mounts.

## Layer 3: User Namespace UID Mapping — Host uid 1000 ≠ Container uid 1000

### Why the default mapping is not identity-preserving

With `:z` labels, files are readable by SELinux policy. But they still show up owned by the wrong user inside the container:

```bash
$ podman exec --user bun systemd-claude-runner-api ls -la /home/bun/.claude.json
-rw-------. 1 1001 1001 22448 Apr 10 20:16 /home/bun/.claude.json
```

The host `keep` user is uid 1000. The container `bun` user is uid 1000. The file was owned by `keep:1000` on the host. It should appear as `bun` inside the container. Instead it shows uid `1001`.

The default rootless Podman {% dictionaryLink "user namespace", "user-namespace" %} mapping explains the discrepancy:

```
# /proc/self/uid_map — default rootless, no --userns flag
         0          1       1000    # container 0-999 → host 1-1000
      1000          0          1    # container 1000 → host 0 (host root)
      1001       1001      64536    # container 1001+ → host 1001+
```

In this default mapping, host uid 1000 (`keep`) maps to container uid **999** — not 1000. The first range maps host uids 1 through 1000 to container uids 0 through 999; host uid 1000 lands at container uid 999. Container uid 1000 is reserved for mapping host root (uid 0) into the container.

`--userns=keep-id` changes this. It instructs Podman to configure the namespace so the current user's UID maps identity-preserving into the container — host uid 1000 becomes container uid 1000. Files mounted from `/home/keep/` (host uid 1000) appear as `bun:1000` inside the container without any `chown`.

```ini
PodmanArgs=--userns=keep-id --stop-timeout=10
```

One precondition: since `oven/bun:slim` already has a `bun` user at uid 1000 and the host `keep` user is also uid 1000, they align naturally. If the image user and the host user have different UIDs, `--userns=keep-id:uid=CONTAINER_UID` allows overriding the target UID inside the namespace.

### The final working Dockerfile

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

Note: `/root/.bun` is copied to `/opt/bun` because the `bun` user can't traverse `/root/` (mode 700) — the same traversal issue as Issue 1, applied to a different path.

## Diagnosing at the Right Layer

When `posix_spawn` returns EACCES in a rootless container, work through the three layers in order:

**1. POSIX DAC** · `ls -la` the binary AND its working directory. Check the `x` bit on every component of the working directory path for the container user. The working directory is often inherited from the image's `WORKDIR` setting, not from a `cwd` option in the spawn call.

**2. SELinux MAC** · `ls -laZ` the mounted files. Run `ausearch -m avc -ts recent` and check for AVC denials. Understand whether `:Z` or `:z` is appropriate before using either; the default changes your host system.

**3. User namespace** · `cat /proc/self/uid_map` inside the container. Verify that host file UIDs map to the UIDs your container user expects. If host and container UIDs should match, use `--userns=keep-id`.

This pattern isn't specific to Bun or Podman. Any runtime that sets the working directory before calling `execve()` in its spawn sequence — and that includes Node's `child_process.spawn`, Python's `subprocess`, and Go's `os/exec` — will fail the same way when the working directory is inaccessible. The working directory issue doesn't show up in direct shell execution (`podman exec /bin/echo`) because shells don't set the working directory as part of the exec sequence.

Error messages name the last thing accessed before failure, not the first thing that failed. `posix_spawn EACCES` names the binary because Bun wraps the entire spawn sequence — chdir, rlimit setup, fd management, execve — under a single abstraction, and the abstraction surfaces the final intended target rather than the intermediate step that failed.

The three systems are independent, and they interact only at the symptom layer. Test each independently.
