---
layout: article.njk
title: "The Story of Mel Is Technically Impossible — and That Makes It Better"
description: "The most beloved poem in programming culture describes a hardware trick that can't work on the hardware it describes. The forensic investigation that proves it reveals something more interesting than the myth."
date: 2026-05-01
keywords: ["story of mel", "mel kaye rpc-4000", "drum memory programming", "self-modifying code history", "programming folklore", "rpc-4000 instruction word", "ed nather poem", "real programmer history"]
tags: ["programming-history", "computer-history", "folklore", "drum-memory", "machine-code", "self-modifying-code", "deep-dive", "thought-leadership"]
difficulty: intermediate
contentType: deep-dive
technologies: []
locale: en-us
permalink: /blog/en-us/the-story-of-mel-is-technically-impossible-and-that-makes-it-better/
---

**TL;DR:**
- In 1983, Ed Nather published a Usenet poem about Melvin Kaye, a programmer who wrote a loop that killed itself by letting array-index overflow mutate the running opcode into an unconditional jump
- Two independent forensic analyses of surviving RPC-4000 hardware documentation show the mechanism Nather described is impossible, for two separate and irreconcilable reasons
- A real overflow-based self-termination mechanism does exist on the RPC-4000, through a different code arrangement than Nather described
- Technical folklore transmits insights intact· it transmits mechanisms unreliably. Reading the primary source is the fix.

---

## The Legend That Stuck

In May 1983, Ed Nather posted a piece of prose to the Usenet newsgroup `net.followup` that has not stopped circulating since. The subject was his former colleague Melvin Kaye, a programmer at Royal McBee Computer Corporation who in the early 1960s had written real-time blackjack for the LGP-30 and RPC-4000 in raw machine code, by hand, placing each instruction around the drum for optimal rotational timing.

The poem's tone is that of a convert describing a saint. Nather writes about how Mel refused the assembler the manufacturer provided. How he maintained a precise mental model of the drum surface and arranged instructions so that each one arrived at the read head exactly when the CPU was ready for it. How he found a bug in a business application and fixed it not by changing the logic but by rearranging the physical positions of instructions on the drum, because that rearrangement also happened to improve execution speed by reducing wait time between reads.

The climax describes a loop with no explicit exit condition. Mel placed his data array at the highest addressable memory locations. When the array index overflowed past the last element, Nather writes, the carry bit rippled through the index-tag bit and into the {% dictionaryLink "opcode", "opcode" %} field, converting the running instruction from an indexed load into an unconditional `JUMP 0`. The loop terminated by mutating its own meaning. No branch instruction anywhere in the code. The program stopped because the arithmetic of running out of elements was the same act as the arithmetic of jumping to the start.

This story entered the Jargon File, the canonical dictionary of hacker culture maintained by {% externalLink "Eric S. Raymond at catb.org", "http://www.catb.org/jargon/" %}, and defined what a "Real Programmer" was: someone whose understanding of the machine was so complete that arithmetic and control flow were the same thing. Generations of programmers encountered it as received wisdom. It appeared in books, in conference talks, in the kind of late-night technical conversation where people tell each other about the giants who came before.

Nobody checked the hardware manual.

## What the RPC-4000 Actually Looked Like

The RPC-4000 was a {% dictionaryLink "drum-memory", "drum-memory" %} computer. Its main storage was a rotating magnetic drum; the CPU fetched instructions and data from fixed read heads as the drum surface spun past. There was no cache, no separate memory hierarchy. Code and data lived on the same physical cylinder.

The practical consequence was that placement was performance. If the next instruction sat just past the read head when the CPU needed it, the machine waited nearly a full rotation before it arrived, roughly 17 milliseconds, an eternity by the standards of instruction execution. A skilled programmer arranged code so each instruction arrived at the read head precisely when the CPU was ready for it. The difference between a carefully timed program and a naive one could be a factor of fifty in execution speed. Mel Kaye was, by all accounts of people who worked with him, unusually skilled at this.

{% dictionaryLink "Self-modifying code", "self-modifying-code" %} was standard practice on this class of machine, not an exotic trick. Because there was no indexed addressing in the modern sense, loops often worked by having a program increment a literal address embedded in an {% dictionaryLink "instruction word", "instruction-word" %} and write the modified word back into the code stream. Writing a new address into an instruction was not a hack against the machine; it was the idiomatic way to iterate. The conceptual space Mel operated in, where code and data are not fundamentally distinct and arithmetic on a word can change what it means, was native to the hardware.

Each instruction was encoded as a fixed-width word containing three fields: an opcode specifying the operation to perform, an address field specifying which memory location to act on, and a single index-tag bit controlling whether the address register further modified the base address. The relative arrangement of those fields in the word, which bits sit where in the pattern, is where two independent forensic researchers found their footing.

## Two Reasons the Hack Can't Work

In the 2010s and 2020s, separate researchers obtained surviving RPC-4000 hardware reference documentation and worked through Nather's mechanism against the actual instruction word layout. They worked independently. Their conclusions converged: the mechanism as Nather described it cannot function on this hardware. There are two separate reasons.

**The index-tag bit is not in the carry path.**

For Nather's mechanism to work, an arithmetic overflow in the address field must carry its way through the index-tag bit and then continue into the opcode field. The index-tag has to sit between the address and opcode fields in bit-significance order, acting as an intermediate step in the carry chain.

On the actual RPC-4000, it does not. The two forensic sources describe the exact instruction word layout differently: one places the opcode at the high-significance end and the index-tag at the low end below the address field; the other places them in a different arrangement entirely, but they agree on the point that matters: the index-tag bit is not positioned as an intermediary between the address and opcode. In neither reading does the carry path pass through the index-tag on its way between those fields. Nather described the index-tag as the essential middle step; on the actual hardware, it occupies no such position.

The researchers also note a secondary problem in this line of argument: on the RPC-4000, opcode zero was not a jump instruction. Even if the carry path worked as Nather described, the resulting opcode would not produce the `JUMP 0` he wrote about.

**Track 127 is the wrong place for a data array.**

Nather specifies that Mel placed his array at the highest addressable memory locations, at the top of what the instruction set could reach. This is the detail that makes the index overflow plausible. On the RPC-4000, those highest-addressed locations correspond to track 127 of the drum.

Track 127 holds exactly 8 words. These 8 words were the RPC-4000's closest equivalent to CPU registers: a fast-access recirculating section where data was automatically repeated in rapid rotation, providing the fastest possible access times of any location on the drum. They were scratchpad locations, used for intermediate calculations precisely because of their speed advantage.

A programmer who placed individual instructions with rotational-timing precision would not occupy those 8 precious fast-access locations with a working data array. The detail that makes the overflow story plausible, that the array runs to the absolute limit of addressable memory, is precisely the detail that makes the performance story impossible. Both facts cannot simultaneously be true about the work of a programmer whose defining characteristic was speed optimization.

These are two independent impossibilities. Either one is sufficient to rule out Nather's mechanism; together they make the conclusion definitive.

## The Hack That Could Work

Neither forensic analysis stopped at falsification. Both asked the natural follow-up question: is there *any* mechanism on the RPC-4000 by which arithmetic overflow could produce a self-terminating control-flow change? Both found one, through a different code arrangement than the one Nather described.

One proposed mechanism involves the Branch Control Unit, an internal flag in the RPC-4000's architecture. A conditional jump instruction on this machine fires only when the BCU flag is active. An arithmetic overflow can set the BCU flag. If a loop body is arranged so that exhausting the array index produces a register overflow, and the relevant instruction is a conditional transfer keyed to the BCU, the loop terminates when the data runs out, without any explicit comparison, without a visible branch condition in the code. The arithmetic of running out of elements becomes the act of stopping. No branch instruction required.

The underlying insight Nather captured is entirely sound. On this class of machine, where the distinction between code and data was a matter of interpretation rather than hardware enforcement, arithmetic overflow was not merely an error condition. It was a programmable event that could alter what the machine did next. Mel almost certainly did something in this family. What Nather wrote down was a reconstruction made 22 years later, shaped by his memory of what he had witnessed and his partial understanding of the hardware internals.

The hack is real· the description of the hack is wrong.

## What Breaks Down When Knowledge Travels

Nather published his poem in 1983, roughly 22 years after he worked alongside Mel Kaye at Royal McBee. He was an astronomer, a significant contributor to astronomical time-series analysis software and later professor emeritus at the University of Texas at Austin, not a machine-code programmer. He admired what Mel could do and grasped the essence of what he was witnessing. He did not share Mel's intimate knowledge of which bit sat where in the instruction word.

He understood that overflow was the mechanism of termination. He then constructed the most plausible implementation narrative consistent with his memory, his understanding of the machine's architecture, and the logic of how such a thing would have to work. That reconstruction became the text of the poem. The text became the Jargon File entry. The Jargon File entry became a generation's understanding of what "Real Programmer" meant.

The poem circulated in a culture that valued the insight and had no particular reason to audit the mechanism. Each retelling stripped out another layer of uncertainty and replaced it with confident specificity. Nobody was inventing anything; everyone was doing what humans do when they retell technical stories, completing the gaps with the version that made the most coherent sense. The legend became more precise over time, not less. That is the opposite of what epistemically careful practice would produce, and exactly what memory researchers would predict.

This is how technical folklore transmits: by essence reliably, by mechanism unreliably. The core insight, overflow as programmable event, survived four decades of retelling without meaningful distortion. The implementation detail, which carry path through which field, which track, which bit position, accumulated plausible-but-incorrect specificity over the same period.

You can find the same pattern across programming culture. Rules about when branch prediction fails, how the kernel handles network buffers, what garbage collection costs in a specific runtime, how a given memory model orders operations: all of these are typically correct in spirit and simplified or outdated in mechanism. The essences propagate because they are what the story is fundamentally about. The mechanisms drift because most listeners are not consulting the architecture documentation.

The fix is the same in every case: go read the primary source. The RPC-4000 hardware reference documentation exists in archives. The instruction word field layout is in it. The track 127 specification is in it. The researchers who eventually performed this forensic analysis had no special access; they had patience and the willingness to check what the machine's actual documentation said. That willingness is not exotic. It is just rare.

## The Invitation

The Story of Mel is still worth reading. It is still one of the more remarkable pieces of writing about what it meant to know a machine so well that your relationship with it was physical, placing instructions by hand on a spinning cylinder, writing code in four dimensions including time. That skill is genuinely gone. The hardware we use now does not offer it.

What the forensic analysis adds is not a debunking. Nather got the spirit exactly right· he got the mechanism wrong because he was reconstructing from memory something he had witnessed but not dissected. That is not a failure; it is how human memory and technical transmission work.

The lesson for practitioners is more precise than "don't trust folklore." Folklore reliably tells you what something means and why it mattered. It unreliably tells you how it worked. For the "what" and "why," the legend is trustworthy. For the "how," go read the primary source. It tends to be more interesting than the legend anyway. The real mechanism, an overflow that sets a conditional-jump flag through an internal BCU rather than mutating an opcode through a carry chain that does not exist, is subtler and more characteristic of how this class of machine operated. The legend ironed it into something more dramatic. The primary source has the real thing.

Mel almost certainly read every word of his machine's hardware reference before he wrote a line of code on it.

## References

- {% externalLink "Dissecting the Story of Mel", "https://www.e-basteln.de/computing/rpc4000/storyofmel/" %} — e-basteln.de (primary forensic analysis of the RPC-4000 instruction word layout)
- {% externalLink "Mel's Hack — The Missing Bits", "https://melsloop.com/docs/the-story-of-mel/pages/mels-hack-the-missing-bits" %} — melsloop.com (independent forensic reconstruction)
- {% externalLink "Macho Programmers, Drum Memory, and a Forensic Analysis of 1960s Machine Code", "https://www.freecodecamp.org/news/macho-programmers-drum-memory-and-a-forensic-analysis-of-1960s-machine-code-6c5da6a40244/" %} — FreeCodeCamp (accessible narrative with historical context)
- {% externalLink "The Story of Mel (Jargon File)", "http://www.catb.org/jargon/" %} — catb.org (the primary text and its canonical home)
- {% externalLink "Ed Nather", "https://en.wikipedia.org/wiki/Ed_Nather" %} — Wikipedia (biographical background)
- {% externalLink "Drum memory", "https://en.wikipedia.org/wiki/Drum_memory" %} — Wikipedia (background on rotational storage)
