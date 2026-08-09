---
layout: article.njk
title: "How to Statically Compile Offensive Tools for Any Linux Architecture"
description: "Three practical pipelines for building portable static nmap binaries that run on any Linux architecture — Alpine/musl containers, Zig cc, and Docker buildx — plus binary hygiene and pre-built fallbacks."
date: 2026-04-29
keywords: ["static linking nmap", "cross compile nmap arm64", "static binary pentest toolkit", "musl static compile", "zig cross compile linux", "offensive tooling multi-arch", "red team static binaries", "nmap aarch64", "penetration testing binaries"]
tags: ["security", "linux", "penetration-testing", "offensive-tooling", "cross-compilation", "docker", "static-linking", "red-team"]
difficulty: intermediate
contentType: guide
technologies: []
type: article
locale: en-us
permalink: /blog/en-us/how-should-i-statically-link-offensive-tooling-such-as-nmap-so-i-can-compile-it/
---

## TL;DR

Static linking bundles every dependency into a single binary that runs on any Linux target matching its architecture, with no package manager or runtime dependencies. Three pipelines cover the common scenarios:

1. **Alpine/musl container** — simplest approach; works for any autoconf-based C/C++ tool; recommended default
2. **Zig cc** — one-binary cross-compiler; zero Docker required; switch targets with a single flag
3. **Docker buildx + QEMU** — full multi-arch automation; slower but eliminates cross-compilation edge cases

Go-based tools (chisel, ligolo-ng, pspy) are statically linked by default with `CGO_ENABLED=0` and need no special build flags.

---

## Why static binaries matter in professional engagements

When you land on a target box, you rarely control what's installed. The machine might run a locked-down Linux distribution with no package manager, a read-only filesystem outside `/tmp` or `/dev/shm`, no internet access, and a CPU architecture that differs from your attack platform.

Dynamically linked binaries, the default output of nearly every C/C++ build, carry an embedded list of shared libraries they expect to find at specific paths on the target. If those libraries are absent, wrong-version, or wrong-architecture, the binary fails immediately:

```text
$ ./nmap-dynamic
./nmap-dynamic: error while loading shared libraries: libpcap.so.1:
  cannot open shared object file: No such file or directory
```

A static binary bundles every library it needs into a single file. The result runs on any Linux kernel matching its ISA, regardless of what userspace libraries the target has installed. The trade-off is binary size and, for GPL-licensed code, inherited redistribution obligations when static libraries are GPL.

---

## The core complication: glibc vs. musl

Most Linux distributions ship glibc, and most C software links against it. The problem: **glibc was not designed to support fully static linking**. It uses `dlopen` internally for features like NSS (name service switch) and locale data. Statically linking glibc produces oversized binaries that often fail at runtime.

The canonical fix is building against **musl libc** instead. musl was designed from the ground up for clean static linking: no hidden dynamic loading, no NSS plugins, no surprises. Alpine Linux ships musl as its default libc, which makes an Alpine container the simplest static-build environment available: install `build-base` and you are already on musl.

---

## Pipeline 1: Alpine/musl containers (recommended default)

The Alpine container approach requires only Docker and works for any autoconf-based C/C++ tool· nmap, socat, masscan, and ncat all compile the same way. nmap is the worked example· its autoconf + libpcap setup represents what most C/C++ tools look like.

```bash
docker run --rm -v "$PWD:/out" alpine:3.19 sh -c '
  apk add --no-cache build-base openssl-dev openssl-libs-static \
    libpcap-dev lua5.4-dev zlib-static
  git clone --depth=1 https://github.com/nmap/nmap /tmp/nmap
  cd /tmp/nmap
  ./configure --without-ndiff --without-nmap-update \
              --without-nping --without-zenmap \
              LDFLAGS="-static" LIBS="-lz"
  make -j$(nproc)
  strip -s nmap
  cp nmap /out/nmap-x86_64-static
'
```

**What each piece does:**

- `LDFLAGS="-static"` — tells the linker to prefer `.a` static archives over `.so` shared objects
- `-static` packages (`openssl-libs-static`, `zlib-static`) — provide the `.a` counterparts to the shared libraries; Alpine splits static and shared variants into separate packages
- `--without-ndiff`, `--without-nping`, `--without-zenmap` — disables Python-dependent and GUI components that would drag in non-statically-linkable dependencies
- `strip -s` — removes debug symbols after build; reduces nmap size significantly

**Verify the result:**

```bash
file nmap-x86_64-static
# → ELF 64-bit LSB executable, x86-64, statically linked

ldd nmap-x86_64-static
# → not a dynamic executable
```

libpcap is nmap's trickiest dependency. On Alpine, `libpcap-dev` installs a static-linkable `libpcap.a` that the configure script finds automatically without additional flags.

> **Alpine package names drift between releases.** The `-static` suffix convention (`openssl-libs-static`, `zlib-static`) is stable in Alpine 3.17+, but confirm against the current Alpine package index if you pin to a different base image version.

---

## Pipeline 2: Zig cc (zero-setup cross-compilation)

Zig ships a bundled clang toolchain with complete musl sysroots for every supported target triple. One `zig` binary is the entire cross-compilation environment: no Docker, no multi-hour sysroot build from source.

**Install Zig (one-time):**

```bash
# Check ziglang.org/download for the current version
curl -L https://ziglang.org/download/0.13.0/zig-linux-x86_64-0.13.0.tar.xz | tar xJ
export PATH="$PWD/zig-linux-x86_64-0.13.0:$PATH"
```

**Cross-compile nmap for aarch64 (ARM64):**

```bash
cd nmap
CC="zig cc -target aarch64-linux-musl" \
CXX="zig c++ -target aarch64-linux-musl" \
./configure --host=aarch64-linux-gnu \
            --without-ndiff --without-nmap-update \
            --without-nping --without-zenmap
make -j$(nproc)
strip -s nmap
```

No `LDFLAGS="-static"` is required here· the `-linux-musl` suffix in the target triple implies static-only linking.

**Supported target triples of immediate offensive relevance:**

| Target | Zig triple | Common hardware |
|--------|-----------|-----------------|
| x86_64 Linux | `x86_64-linux-musl` | Servers, workstations |
| aarch64 Linux | `aarch64-linux-musl` | AWS Graviton, Raspberry Pi 4+, Apple Silicon |
| ARMv7 Linux | `arm-linux-musleabihf` | Raspberry Pi 2/3, IoT devices |
| MIPS big-endian | `mips-linux-musl` | Legacy routers |
| MIPS little-endian | `mipsel-linux-musl` | Legacy routers (LE variants) |
| RISC-V 64 | `riscv64-linux-musl` | Emerging RISC-V hardware |

Unlike crosstool-NG or vendor SDKs, Zig takes minutes to set up and produces deterministic output. Switching from x86_64 to ARM64 to MIPS means changing one flag in `CC` and `CXX`.

> **One caveat:** Zig cc's clang backend sometimes diverges from gcc in how it handles autoconf feature detection· configure scripts may produce incorrect results for complex projects. If a build silently breaks or produces an incorrect binary, fall back to the Docker buildx pipeline below.

---

## Pipeline 3: Docker buildx for reproducible multi-arch pipelines

Docker buildx with `--platform` uses Linux's `binfmt_misc` subsystem to register QEMU as an interpreter for foreign architectures, then builds natively inside the emulated environment. It is slower than Zig cc, but eliminates configure-detection bugs that arise when cross-compiler feature probing diverges from the actual target. The build system, tests, and generated code all run on the correct ISA.

**One-time QEMU setup:**

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

**Dockerfile.nmap-static:**

```dockerfile
FROM --platform=$TARGETPLATFORM alpine:3.19
RUN apk add --no-cache build-base openssl-dev openssl-libs-static \
    libpcap-dev zlib-static git
RUN git clone --depth=1 https://github.com/nmap/nmap /src/nmap
WORKDIR /src/nmap
RUN ./configure --without-ndiff --without-nmap-update \
                --without-nping --without-zenmap \
                LDFLAGS="-static"
RUN make -j$(nproc) && strip -s nmap
```

**Build for a single architecture:**

```bash
docker buildx build \
  --platform linux/arm64 \
  --output type=local,dest=./dist \
  -f Dockerfile.nmap-static .
```

**Build a full multi-arch matrix in one pass:**

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --output type=local,dest=./dist \
  -f Dockerfile.nmap-static .
```

The `--output type=local` flag extracts the build artifacts from the container into `./dist/`. Docker creates platform-specific subdirectories under `dist/linux_amd64/`, `dist/linux_arm64/`, and so on, each containing the stripped static binary.

---

## Go-based tools: static by default

Many modern offensive tools are written in Go, which produces statically linked binaries by default when CGO is disabled. Cross-compilation requires no special toolchain:

```bash
# chisel (TCP tunnelling) — ARM64
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build ./...

# ligolo-ng agent — ARMv7
GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build ./...

# ligolo-ng agent — MIPS (soft-float for routers without FPU)
GOOS=linux GOARCH=mips GOMIPS=softfloat CGO_ENABLED=0 go build ./...
```

Go handles musl selection, static linking, and architecture targeting internally. Tools in this category (chisel, ligolo-ng, pspy, Sliver agent components) require no special linker flags and no separate cross-compiler installation.

---

## Pre-built fallbacks and when to use them

When build infrastructure is unavailable or time is short, community repositories provide triage-level tooling:

- **{% externalLink "ernw/static-toolbox", "https://github.com/ernw/static-toolbox" %}** — ERNW's curated static binaries; includes nmap, socat, ncat; targets x86_64 and aarch64
- **{% externalLink "andrew-d/static-binaries", "https://github.com/andrew-d/static-binaries" %}** — historically popular; includes socat, bash, nmap; primarily x86_64; maintenance activity has slowed

Use these with eyes open. Community static binaries are unsigned and cannot be audited for build reproducibility or supply chain integrity. They work for initial triage on a time-pressured engagement, but not for work where contracts or rules of engagement require auditable artifacts. Build from source when provenance matters.

---

## Binary hygiene: strip, compress, and transfer

A complete static-build workflow ends with post-build hardening and delivery:

**1. Strip debug symbols:**

```bash
strip -s nmap
```

Debug symbols are unnecessary for operational use and can more than double binary size. Strip as the final build step, after verifying the binary is correct.

**2. UPX compression (optional):**

```bash
upx --best nmap
```

UPX further compresses the binary; the result is a self-extracting executable. Useful when transfer channels are size-constrained. **Operational caveat:** UPX-packed binaries have a distinctive section header signature (`UPX0`, `UPX1`) that most AV and EDR products detect and flag regardless of the binary's actual content. Use UPX when size matters more than evasion signature.

**3. Verify static linkage:**

```bash
file nmap                         # should report: statically linked
ldd nmap                          # should report: not a dynamic executable
readelf -d nmap | grep NEEDED     # should return nothing
```

**4. Transfer options:**

| Method | When to use |
|--------|-------------|
| `scp` / `sftp` | SSH access available |
| `curl -O` / `wget` | HTTP/S reachable from target |
| `impacket-smbserver` | Windows SMB or Linux SMB mount |
| `base64` + paste | Air-gapped or terminal-only access |
| `nc` / `socat` | Raw TCP listener on attack platform |

Avoid writing to heavily monitored paths. `/tmp` is logged on many hardened images; `/dev/shm` and writable bind mounts tend to attract less attention.

---

## Pipeline comparison

| Pipeline | Setup time | Cross-compile speed | Arch coverage | Best for |
|----------|-----------|--------------------|----|---------|
| Alpine/musl container | ~5 min | Medium | Host arch only | First build, quick iteration |
| Zig cc | ~2 min | Fast | x86_64, arm64, ARMv7, MIPS, RISC-V | Multi-arch without Docker |
| Docker buildx + QEMU | ~10 min | Slow (emulation) | All arches Docker supports | Reproducible CI matrix |

---

## Multi-arch toolkit checklist

| Tool | Repo | Build method | Purpose |
|------|------|--------------|---------|
| nmap | github.com/nmap/nmap | Alpine/musl or Zig cc | Port scanning, service detection |
| socat | distro source | Alpine/musl | Bidirectional relay |
| ncat | (bundled with nmap) | Built with nmap | Netcat alternative |
| masscan | github.com/robertdavidgraham/masscan | Alpine/musl | Fast internet-scale scanning |
| chisel | github.com/jpillora/chisel | Go (`CGO_ENABLED=0`) | TCP tunnelling |
| ligolo-ng | github.com/nicocha30/ligolo-ng | Go (`CGO_ENABLED=0`) | Reverse proxy pivot |
| pspy | github.com/DominicBreuker/pspy | Go (`CGO_ENABLED=0`) | Process monitoring without root |

---

## Sources

- {% externalLink "musl libc — Design and Static Linking", "https://musl.libc.org/about.html" %} — authoritative documentation on musl's static linking design and the glibc limitation
- {% externalLink "Zig Language — Cross Compilation", "https://ziglang.org/learn/overview/#cross-compiling-is-a-first-class-use-case" %} — Zig cc target triple reference and cross-compilation overview
- {% externalLink "Docker Buildx Multi-Platform Builds", "https://docs.docker.com/build/building/multi-platform/" %} — official buildx platform matrix and `--platform` flag documentation
- {% externalLink "tonistiigi/binfmt", "https://github.com/tonistiigi/binfmt" %} — QEMU binfmt_misc installer for Docker multi-arch builds
- {% externalLink "GCC — Link Options (-static)", "https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html" %} — canonical reference for the `-static` linker flag behaviour
- {% externalLink "Go Environment Variables (GOOS, GOARCH, CGO_ENABLED)", "https://pkg.go.dev/cmd/go#hdr-Environment_variables" %} — Go cross-compilation reference
- {% externalLink "UPX — the Ultimate Packer for eXecutables", "https://upx.github.io/" %} — binary compression tool; see also the note on EDR detection signatures
- {% externalLink "ernw/static-toolbox", "https://github.com/ernw/static-toolbox" %} — ERNW's curated static binary repository
- {% externalLink "andrew-d/static-binaries", "https://github.com/andrew-d/static-binaries" %} — community static binary archive (primarily x86_64)
