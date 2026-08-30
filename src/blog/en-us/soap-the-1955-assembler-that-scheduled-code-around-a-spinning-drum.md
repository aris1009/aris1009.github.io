---
layout: article.njk
title: "SOAP: The 1955 Assembler That Scheduled Code Around a Spinning Drum"
description: "In 1955, Stan Poley looked at a spinning magnetic drum and realized that where you place code matters as much as what the code does. SOAP automated the answer, and the insight it embodied never left the stack."
date: 2026-05-24
keywords: ["IBM 650", "SOAP assembler", "drum memory", "optimum coding", "instruction scheduling", "Stan Poley", "computer history", "magnetic drum computer", "compiler optimization history", "flash translation layer", "rotational latency"]
tags: ["programming-history", "computer-history", "drum-memory", "compilers", "performance", "deep-dive", "thought-leadership", "assemblers"]
difficulty: intermediate
contentType: deep-dive
technologies: []
locale: en-us
permalink: /blog/en-us/soap-the-1955-assembler-that-scheduled-code-around-a-spinning-drum/
---

**TL;DR:**
- The IBM 650 (1954) stored programs on a magnetic drum spinning at 12,500 RPM· naively sequential code spent most of the CPU's time waiting for the drum to rotate to the next instruction
- Every IBM 650 instruction contained an explicit "next instruction address" field, making the execution model a linked list where instructions could live anywhere on the drum surface
- Stan Poley's SOAP (1955) turned address assignment into an optimization: for each instruction, it calculated exactly where the drum would arrive when execution finished, then placed the next instruction there
- The result was near-zero {% dictionaryLink "rotational latency", "rotational-latency" %} and speedups routinely described as 5× or more, with no changes to program logic
- The insight, that code placement in physical storage is a performance variable optimizable by a tool, reappears in compiler {% dictionaryLink "instruction scheduling", "instruction-scheduling" %}, SSD {% dictionaryLink "Flash Translation Layers", "flash-translation-layer" %}, and NVMe I/O queues

---

Before pipelining, before caches, before virtual memory, a programmer at IBM looked at a spinning cylinder and thought: the placement of code in space is itself a performance variable. The year was 1955. The machine was the IBM 650. The tool he built was called SOAP, the Symbolic Optimal Assembly Program. It solved a problem that had been tormenting programmers since the first IBM 650 shipped in late 1954: how to stop their programs from spending most of their time doing nothing at all.

## A machine built around a rotating drum

The {% externalLink "IBM 650 Magnetic Drum Data-Processing Machine", "https://www.ibm.com/history/650" %} was something genuinely new when its first unit was installed on December 8, 1954 at the John Hancock Mutual Life Insurance Company in Boston. It was not a scientific instrument for physicists. It was a commercial machine, leased rather than sold, aimed at the banks and insurance companies and universities that could not afford the million-dollar behemoths of the era. IBM had expected to sell perhaps fifty units. By the time production ended in 1962, over 2,000 had been installed worldwide. For a generation of programmers, including Donald Knuth who encountered one at the Case Institute of Technology in 1956, the IBM 650 was *the* computer, the machine that made the abstract idea of programming into a lived experience.

Its main memory was a magnetic drum: a metal cylinder coated with ferromagnetic material, spinning at 12,500 RPM. One full rotation took 4.8 milliseconds. The drum held 2,000 storage locations, evenly spaced around its circumference, accessible only when they rotated under a fixed read/write head. Average time to reach any given address: 2.4 ms, exactly half a revolution.

The timing problem this created was baked into the physics. Many IBM 650 instructions took roughly 2–3 ms to execute. If you placed instruction 2 immediately after instruction 1 in sequential drum addresses, the most natural thing to do, here is what happened: the CPU finished executing instruction 1 and went looking for instruction 2. But in the 2–3 ms instruction 1 had consumed, the drum had already rotated past instruction 2's location. The CPU then sat idle, waiting for nearly a full revolution, up to 4.8 ms, for instruction 2 to come back around.

The arithmetic is punishing. An instruction that takes 2.5 ms to execute followed by a 4.8 ms drum wait means the CPU is idle for 4.8/(2.5+4.8) ≈ 66% of the time. For shorter instructions the idle fraction climbs further; on programs dominated by quick operations it could reach 80–90%. On a naively laid-out program, the machine was spending most of its existence staring at a spinning drum. This was not a bug or an oversight· it was physics, and every programmer on every IBM 650 in the world was living with it.

## The instruction format that made the solution possible

What made SOAP possible was a design decision baked into the IBM 650's {% dictionaryLink "instruction word", "instruction-word" %} format itself.

The IBM 650 instruction word is a 10-digit decimal number containing four fields: the operation code (what to do), the data address (where to read data from), and, most unusually, an explicit **instruction address** field specifying where to find the *next* instruction. This was not a program counter that automatically incremented after each instruction. Every instruction in a program explicitly named the drum location of its successor. After executing each instruction, the hardware jumped to whatever address that field specified.

This is, literally, a linked list of machine code baked into the ISA. Each instruction is a node; the instruction address field is its next pointer. And this was not an optimization trick or an advanced technique· it was the native, ordinary execution model of the machine. Every IBM 650 program ran this way.

The consequence for placement is profound. Instructions did not need to be physically adjacent. They could live anywhere across the 2,000 drum locations, connected by those explicit forward pointers. The programmer, or assembler, was free to scatter instructions across the entire drum surface. The question then became not *whether* to place instructions at specific addresses, but *which* addresses to choose. Choosing well was the difference between a program that flew and one that crawled.

## SOAP: the assembler as scheduler

In 1955, Stan Poley at {% externalLink "IBM's Thomas J. Watson Research Center", "https://research.ibm.com/" %} wrote the Symbolic Optimal Assembly Program. The name is exact. "Symbolic" because you wrote in mnemonic assembly language rather than raw numeric machine code. "Optimal" because the assembler's central task was finding placements that minimized {% dictionaryLink "rotational latency", "rotational-latency" %}.

Consider a two-instruction sequence, A followed by B. SOAP carried a table of timing data for every IBM 650 operation: how many milliseconds each {% dictionaryLink "opcode", "opcode" %} took to execute. Given that information and the drum position when A began executing, SOAP could calculate exactly where the drum head would be the moment A finished. It then placed instruction B at precisely that drum address.

The underlying arithmetic is clean. The drum has 2,000 locations and completes a full revolution in 4.8 ms, passing approximately 417 locations per millisecond under the read head. An instruction that takes 2.4 ms means the drum has advanced roughly 1,000 locations during execution. SOAP placed the successor instruction 1,000 locations ahead in the drum's rotation sequence: the address that would arrive at the read head at exactly the right moment, with near-zero wait.

For an entire program, SOAP performed this calculation for each consecutive instruction pair in sequence. The result was code where fetching the next instruction was effectively free: by the time the CPU needed it, it was already arriving. Knuth, writing from his own experience programming on the IBM 650, describes speedups that were routinely dramatic. He cites 5× or more over naively sequential code, with no changes to the program's logic whatsoever. The same computation, the same algorithm, rearranged on the drum surface and suddenly fast.

## Optimum coding: the art SOAP automated

Poley's assembler did not invent the solution· it automated one that skilled programmers had been doing by hand since the first IBM 650s shipped. The practice was called **{% dictionaryLink "optimum coding", "optimum-coding" %}**. You drew timing diagrams. You calculated drum positions by hand for each instruction pair. You assigned addresses yourself, holding simultaneously in your head a model of what the code did and a spatial model of where each piece of it should live on the drum surface.

It was painstaking and error-prone, the exclusive domain of programmers with the patience and spatial intuition it required. A programmer doing optimum coding by hand had to reason in four dimensions at once: the logical sequence of operations, their execution times, their physical positions on the drum, and the drum's rotational state at each moment of execution.

Ed Nather's poem about [Mel Kaye on the RPC-4000](/blog/en-us/the-story-of-mel-is-technically-impossible-and-that-makes-it-better/) captures what that skill looked like from the outside: a programmer so attuned to the drum's geometry that fixing a bug and improving a program's timing were sometimes the same act. Mel worked without the assembler the manufacturer provided, placing every instruction by hand around the drum surface. He was exceptional. Most programmers were not.

SOAP separated the two concerns. You reasoned about the logic of your program; the assembler reasoned about the geometry of the drum. You wrote symbolic assembly code in the natural order of execution; SOAP emitted binary with optimal placement computed for you. SOAP made optimum coding accessible to every IBM 650 programmer, not just those with the spatial intuition and free hours for timing diagrams.

## The modern lineage

SOAP's insight, that the physical placement of code in storage is a performance variable and that a translation tool can optimize it without the programmer's involvement, did not remain in 1955. It was rediscovered at every layer of the computing stack.

**Compiler instruction scheduling.** When transistor computers gave way to pipelined architectures in the 1960s and 1970s, idle time appeared in a new form: pipeline hazards. A pipelined processor cannot issue an instruction that depends on the result of the immediately preceding instruction; there is a latency between when a computation begins and when its result is ready. The compiler response was {% dictionaryLink "instruction scheduling", "instruction-scheduling" %}: reorder operations within the constraints of data dependencies to fill pipeline slots that would otherwise stall. The algorithmic structure is identical to SOAP's: given a set of instructions with timing constraints, find an ordering that minimizes idle time. SOAP optimized spatial placement on a drum; modern compilers optimize temporal ordering in a pipeline. The constraint-satisfaction problem is the same.

**SSD Flash Translation Layers.** Inside a modern solid-state drive, the {% dictionaryLink "Flash Translation Layer", "flash-translation-layer" %} maps the logical addresses the operating system sees to physical NAND flash pages. The mapping is not arbitrary: different cells have different wear histories, and repeatedly writing to the same physical cell degrades it. The FTL scatters writes across cells to balance wear and minimize both latency and degradation, choosing physical placements that the programmer and operating system never see. This is drum scheduling applied to solid-state storage: a translation layer that decouples logical address from physical location, using geometry knowledge invisible to the layer above.

**NVMe I/O queue reordering.** The NVMe specification explicitly permits, and encourages, drive controllers to service I/O commands out of submission order when doing so reduces latency. The controller knows the physical layout of its NAND; the host does not. By allowing reordering, NVMe institutionalizes exactly what SOAP embodied: the entity with knowledge of physical geometry should make placement and ordering decisions, not the entity that only knows logical addresses.

**CPU out-of-order execution.** Modern processors go further still, dynamically reordering micro-operations at runtime to hide memory latency, a hardware-level SOAP running billions of times per second, invisible to programmer and compiler alike.

Each is an independent rediscovery of the same principle, scaled to a different layer of the storage and execution hierarchy. The drum became the pipeline became the NAND became the NVMe queue. The physics changed· the principle did not.

## The principle that migrates down the stack

With each new storage technology, performance characteristics initially appear as fixed constraints: physics, not variables. Programmers write code; it runs at whatever speed the hardware allows. Then someone looks at the physics and notices: placement is a variable, not a given, and a tool already exists to assign addresses. Turning that assignment into an optimization is a conceptual step, not a technical one. The assembler was already assigning drum addresses. Making the assignment optimal required only recognizing the scheduling problem hiding inside it.

This recognition always seems to arrive in the same sequence. First, skilled practitioners optimize by hand: the pre-SOAP optimum coders, the early pipeline schedulers, the first storage engineers hand-tuning wear-leveling logic. Then someone automates the insight, hides it behind an abstraction, and the skill itself disappears from view. By the time most programmers encounter the technology, its placement optimization is already running underneath them. The layer that was once the subject of expert attention becomes the infrastructure others stand on.

Knuth, reflecting on the IBM 650 decades later, noted that even the manual version of optimum coding built an intuition for the relationship between code structure and physical execution, one that shaped his thinking about algorithms for the rest of his career. Programs are physical objects with spatial and temporal relationships to their hardware· that is, arguably, the foundational insight of systems programming.

SOAP made that insight accessible to everyone on the most widely installed computer of its era. It also established the template: the program that assigns addresses is the right program to optimize them. Seventy years later, that template is still running· it has just moved somewhere most people never think to look.

## References

- {% externalLink "Symbolic Optimal Assembly Program", "https://en.wikipedia.org/wiki/Symbolic_Optimal_Assembly_Program" %} — Wikipedia (overview and attribution)
- {% externalLink "IBM 650", "https://en.wikipedia.org/wiki/IBM_650" %} — Wikipedia (hardware specifications and history)
- {% externalLink "The IBM 650", "https://www.ibm.com/history/650" %} — IBM History (institutional history and commercial context)
- {% externalLink "The IBM 650 Magnetic Drum Calculator", "https://www.columbia.edu/cu/computinghistory/650.html" %} — Columbia University Computing History (detailed technical and historical reference)
- Donald E. Knuth, "The IBM 650: An Appreciation from the Field," *IEEE Annals of the History of Computing* 8(1), 1986 — primary witness account and canonical attribution of SOAP to Poley
- {% externalLink "IBM 650 System", "https://www.computerhistory.org/revolution/early-computer-companies/5/111/475" %} — Computer History Museum
