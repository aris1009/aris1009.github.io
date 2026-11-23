---
layout: article.njk
title: "The 1957 Compiler That Used Monte Carlo Simulation — and Wasn't Beaten for a Decade"
description: "FORTRAN I shipped in April 1957 with a Monte Carlo block-placement pass that is structurally identical to modern profile-guided optimisation. Its optimisation depth wasn't matched by another production compiler until Fortran H in the late 1960s."
date: 2026-08-16
keywords: ["FORTRAN I compiler history", "profile-guided optimization history", "Monte Carlo compiler 1957", "Sheldon Best register allocator", "John Backus FORTRAN", "Fortran H optimizing compiler", "compiler optimization history", "1957 FORTRAN WJCC"]
tags: ["compiler-history", "programming-history", "optimization", "profile-guided-optimization", "fortran", "computer-history", "deep-dive", "thought-leadership"]
difficulty: intermediate
contentType: deep-dive
technologies: []
locale: en-us
permalink: /blog/en-us/the-1957-compiler-that-used-monte-carlo-simulation-and-wasn-t-beaten-for-a-decad/
---

**TL;DR:**
- FORTRAN I (April 1957) performed global optimisation (loop-invariant code motion, common subexpression elimination, and redundant address-computation removal) a decade ahead of routine production use elsewhere
- Sheldon Best's register allocator worked by simulating candidate instruction sequences and selecting the assignment with the best simulated performance, sidestepping the NP-hard exact problem
- A `FREQUENCY` statement let programmers annotate branch likelihoods; the compiler ran a weighted Monte Carlo simulation at compile time, found the statistically hot path, and arranged basic blocks to keep it sequential, a mechanism structurally identical to modern PGO
- Optimisation quality peaked in 1957, then regressed as simpler compilers proliferated; Fortran H (c. 1968–1969) was the first production compiler to match it again
- `__builtin_expect`, `[[likely]]`, and `[[unlikely]]` are 1957 ideas in modern syntax

---

## The priesthood and their mistake

In 1954, John Backus submitted a proposal to IBM for a compiler that would translate mathematical notation into machine instructions for the IBM 704. The reaction from experienced programmers was close to mockery.

Programming was a craft at that moment, a specialist art whose practitioners guarded their knowledge of scarce hardware registers and obscure timing quirks the way guilds once guarded trade secrets. The idea that a *program* could write better machine code than a seasoned practitioner was, to them, self-evidently absurd. They had numbers to support the intuition: compiler-generated code would be 20 to 50 percent slower than hand-coded assembly, making it commercially useless for the scientific computing market IBM was targeting.

Backus assembled a team of thirteen people. On February 28, 1957, that team presented "The FORTRAN Automatic Coding System" at the Western Joint Computer Conference in Los Angeles. The compiler began shipping on IBM 704 systems in April of that year.

The degree to which the sceptics were wrong is what makes this story worth revisiting nearly seventy years later.

## What FORTRAN I actually did

The easy assumption about early compilers is that they were naive translators: take a high-level statement, emit the obvious machine-code equivalent, repeat. FORTRAN I was not that.

The 1957 paper describes a multi-pass system with explicit optimisation phases. The compiler performed {% dictionaryLink "loop-invariant code motion", "loop-invariant-code-motion" %}: computations whose values do not change across iterations of a DO-loop were hoisted out before the loop, eliminating redundant recalculation on every pass. It performed {% dictionaryLink "common subexpression elimination", "common-subexpression-elimination" %}: intermediate results appearing in multiple expressions were computed once and reused. It eliminated redundant address calculations· the IBM 704's addressing model made address computation expensive, and the compiler recognised and suppressed repeated equivalent calculations.

These passes, taken together, constitute what the field now calls *global optimisation*, optimisation that reasons across statement boundaries and across control flow, not just locally within a single statement. Frances Allen and John Cocke would later formalise this exact taxonomy in their 1972 paper "A Catalogue of Optimizing Transformations." FORTRAN I had implemented it, by ingenuity and insight rather than formal theory, fifteen years earlier.

The {% dictionaryLink "register allocation", "register-allocation" %} component, designed by Sheldon Best, was equally striking. The IBM 704 had three index registers, a scarce resource when a scientific program might reference dozens of array indices and loop counters simultaneously. Optimal register assignment is, in general, NP-hard· the graph-colouring formulation that would later dominate the field was still decades away. Best's solution was to sidestep the exact problem entirely: the allocator *simulated the execution of candidate instruction sequences* and selected the assignment with the best simulated performance. The result, in Backus's own retrospective description, was "nearly optimal", matching or beating what expert IBM 704 programmers would write by hand.

The sceptics were, in Backus's telling, astonished. Programs they had confidently predicted would run 20 to 50 percent slower than hand-coded assembly turned out to run within a few percent of it. Some matched it exactly.

## The Monte Carlo trick

The most structurally surprising component of FORTRAN I was its approach to {% dictionaryLink "basic block", "basic-block" %} placement.

For a sequential von Neumann machine like the IBM 704, executing a branch, a conditional or unconditional jump, was more expensive than falling through to the next sequential instruction. The compiler therefore wanted to arrange basic blocks so that the common execution path was sequential, minimising costly jumps. The problem: the compiler cannot know at compile time which branches are commonly taken. That is runtime information, not compile-time information.

FORTRAN I's answer was to ask the programmer. A `FREQUENCY` statement preceding an `IF` or computed `GO TO` supplied integer weights representing the relative likelihood of each branch:

```fortran
      FREQUENCY (20, 5)   ! first branch taken 20x more often than second
      IF (X .GT. 0.0) 10, 20
```

The compiler then ran a Monte Carlo simulation of the program's control flow at compile time. Conditional transfers were resolved by a weighted random number generator seeded from those `FREQUENCY` annotations. By sampling many simulated executions, the compiler built a statistical picture of execution frequency for each basic block and arranged them to keep the hot path sequential.

This mechanism is structurally identical to {% dictionaryLink "profile-guided optimisation", "profile-guided-optimization" %} (PGO) as practised today. The comparison is precise:

| Dimension | FORTRAN I (1957) | Modern PGO |
|---|---|---|
| Profile source | Programmer-supplied `FREQUENCY` hints | Runtime instrumentation on representative inputs |
| Simulation method | Compile-time weighted Monte Carlo | Execution counter collection |
| Optimisation goal | Basic block placement for sequential execution | Block placement + inlining decisions + branch prediction hints |
| Data quality | Approximate (human estimate) | Exact (for the profiled workload) |
| Portability | Tied to programmer annotation | Tied to representative input availability |

The idea is the same. Only the data source (human estimate versus measured execution) differs. When {% externalLink "GCC's `-fprofile-use`", "https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html" %} and {% externalLink "LLVM's `-fprofile-instr-use`", "https://llvm.org/docs/HowToBuildWithPGO.html" %} arrange basic blocks using runtime profile data, they are executing the same optimisation that shipped in April 1957.

One precision worth keeping: the 1957 paper describes the mechanism, a weighted random number generator resolving conditional transfers during a compile-time simulation, without using the label "Monte Carlo." The characterisation is accurate· it is the framing of modern readers looking back, not the vocabulary of the original paper.

## A decade without a successor

The efficiency of FORTRAN I code shocked even its authors. But the shock did not immediately trigger a wave of optimising compilers. The opposite happened.

As the IBM 704 gave way to the IBM 709 and then the IBM 7090, and as FORTRAN spread to other manufacturers through their own implementations, the compilers that proliferated were mostly simpler. They translated faithfully but optimised little. The 704-specific tricks in FORTRAN I's register allocator and block-placement passes did not transfer cleanly to different architectures. Compiler writers, under commercial pressure to ship working translators quickly, skipped the expensive optimisation infrastructure.

The result was a quality inversion: the first serious Fortran compiler was also, for approximately a decade, the most optimising one. Frances Allen, who joined IBM in 1957 and later received the 2006 Turing Award (the first woman to do so) for her foundational work on optimising compilers, described FORTRAN I as "the first compiler to do serious global optimisation" and noted that subsequent Fortran compilers for other platforms typically did not attempt the same depth.

IBM's Fortran H compiler, introduced around 1968–1969 for the System/360 architecture, was the first production compiler to recover that optimisation depth. It did so by applying Allen and Cocke's formalised data-flow analysis framework, the same class of passes that FORTRAN I had implemented by insight and ingenuity, to a new architecture through systematic theory.

The narrowness of the claim matters here. This is not an argument that no compiler progress happened between 1957 and 1968. Simpler compilers proliferated, new languages appeared, and compiler theory advanced significantly. The specific argument is narrower: the *combination* of global optimisation passes present in a shipped production compiler was not matched by another shipped production compiler until roughly a decade later.

The "primitive origins to sophisticated present" narrative of compiler history does not survive contact with 1957. Sophistication was present at the origin· what followed was not continuous improvement but a collapse and partial reconstruction.

## What 1957 tells us now

Two design principles from FORTRAN I keep resurfacing in modern compiler and runtime engineering, under different names.

**Statistical approximation beats exact analysis when exact analysis is intractable.** The register allocator and block-placement algorithm both traded exactness for tractability. Where exact solutions would require exponential search (optimal register assignment is NP-hard, and optimal block ordering given unknown branch probabilities is equally intractable), FORTRAN I used simulation and sampling to find good-enough solutions quickly. Modern compilers still use the same trade-off. LLVM's block placement uses profile data, or static heuristics when profile data is absent, to estimate branch probabilities and arrange blocks for sequential hot-path execution. GCC's loop unrolling decisions use static heuristics structurally analogous to FORTRAN I's frequency estimates. The insight is 68 years old.

**User-supplied hints are a legitimate interface, not a workaround.** The `FREQUENCY` statement was removed from later Fortran standards as automatic profiling became the preferred mechanism. But the idea kept returning, because it captures something a runtime profiler cannot:

- {% externalLink "GCC's `__builtin_expect(expr, expected)`", "https://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html" %} lets C and C++ programmers annotate which value of `expr` is expected at runtime, directly guiding branch prediction and block placement.
- {% externalLink "C++20's `[[likely]]` and `[[unlikely]]` attributes", "https://en.cppreference.com/w/cpp/language/attributes/likely" %}, standardised by the ISO C++ committee, provide a portable version of the same idea.
- Java's `@Contended` annotation (JEP 142, JDK 8) lets programmers signal that a field is frequently written by multiple threads, guiding the JVM's memory layout to reduce false sharing, a different domain but the same principle.

In each case, the programmer knows something the runtime profiler either cannot collect or cannot collect cheaply enough to act on. The deployment workload may differ from the profiled workload. Structural knowledge about the algorithm may not be visible in any sample of actual executions. The `FREQUENCY` statement was not a substitute for absent profiling tools· it was a recognition that programmer knowledge and profiler knowledge are complementary, not interchangeable.

Engineers who encounter `__builtin_expect` or reach for PGO flags in a CI pipeline are reinstating ideas that were already operational in 1957. That is not a critique of modern practice· it is evidence that the ideas were right from the start, right enough that the field keeps rediscovering them, usually with a formal theoretical framework attached that was not available in 1957.

## References

- {% externalLink "\"The FORTRAN Automatic Coding System\" — Backus et al., WJCC 1957", "https://dl.acm.org/doi/10.1145/1455567.1455599" %} — ACM Digital Library (primary source; describes the global optimisation passes, register allocator, and FREQUENCY block-placement mechanism)
- Backus, John. "The History of FORTRAN I, II, and III." *ACM SIGPLAN Notices*, vol. 13, no. 8, 1978 — ACM Digital Library (author's retrospective; source of "nearly optimal" characterisation and the decade-gap acknowledgement)
- Allen, Frances E. "The History of Language Processor Technology in IBM." *IBM Journal of Research and Development*, vol. 45, no. 2, 2001 (confirms the decade gap; describes Fortran H as the recovery point; confirms FORTRAN I as the origin of global optimisation in production compilers)
- Allen, Frances and Cocke, John. "A Catalogue of Optimizing Transformations." In Rustin (ed.), *Design and Optimization of Compilers*, Prentice-Hall, 1972 (the formalised taxonomy that FORTRAN I prefigured)
- {% externalLink "GCC: Profile Feedback (`-fprofile-use`)", "https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html" %} — GCC documentation
- {% externalLink "LLVM: How to Build with PGO (`-fprofile-instr-use`)", "https://llvm.org/docs/HowToBuildWithPGO.html" %} — LLVM documentation
- {% externalLink "C++20 `[[likely]]` / `[[unlikely]]` attributes", "https://en.cppreference.com/w/cpp/language/attributes/likely" %} — cppreference
- {% externalLink "GCC: `__builtin_expect`", "https://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html" %} — GCC documentation
