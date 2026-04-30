---
layout: article.njk
title: "The Story of Mel Is Technically Impossible — and That Makes It Better"
description: "The most beloved poem in programming culture describes a hardware trick that cannot work on the hardware it describes. The forensic investigation that proves it reveals something more interesting than the myth."
date: 2026-04-30
keyword: story-of-mel, mel-kaye, rpc-4000, drum-memory, self-modifying-code, programming-folklore, retrocomputing, computer-history
difficulty: intermediate
contentType: deep-dive
technologies: ['RPC-4000', 'drum memory']
type: article
locale: en-us
permalink: /blog/en-us/the-story-of-mel-is-technically-impossible-and-that-makes-it-better/
---

The most beloved poem in programming culture describes a hardware trick that cannot work on the hardware it describes. Two independent forensic researchers proved this from the original RPC-4000 hardware manual · and what they found is more interesting than the correction.

> **TL;DR:** Ed Nather's 1983 Usenet poem describes Mel Kaye ending a loop by arranging code so that arithmetic overflow mutated the running instruction's opcode. On the actual RPC-4000, this mechanism is physically impossible for two independent hardware reasons. A real overflow-based control-flow trick *does* exist on the machine; it just works through a different code layout. The lesson: technical folklore reliably transmits the *spirit* of an insight while quietly corrupting the *mechanism*. Primary sources are worth reading.

## The Legend That Stuck

In May 1983, a programmer and astronomer named Ed Nather posted a prose poem to the Usenet group `net.followup`. The subject was his former colleague at {% externalLink "Royal McBee Computer Corporation", "https://en.wikipedia.org/wiki/Royal_McBee" %}, Mel Kaye, who had written a real-time blackjack game for the RPC-4000 in raw machine code. Not assembly language; raw machine code · placing each instruction by hand around the drum to minimize rotational latency.

The poem's climax: Mel's loop had no explicit exit. He had arranged the data array at the top of memory so that when the array index overflowed past the last element, a carry bit rippled through the index-tag bit, then into the opcode field, transforming the running instruction from a conditional load into an unconditional `JUMP 0`. The loop killed itself by mutating its own meaning.

The poem entered the {% externalLink "Jargon File", "http://www.catb.org/jargon/html/story-of-mel.html" %} · the canonical dictionary of hacker culture · and defined what a "Real Programmer" was: someone whose understanding of the machine ran so deep that arithmetic and control flow were the same thing. Generations of programmers encountered it as received truth. Nobody had reason to check the hardware manual.

Nobody needed to. The story was obviously *right* · not accurate, but right. It encoded something true about excellent low-level programming: the idea that a programmer could know a machine so completely that the machine's arithmetic became a vocabulary for expressing intent. That intuition is what made the poem stick. It is also what made the error invisible for decades.

## What the RPC-4000 Actually Was

Before the impossibility lands, you need a picture of the machine.

The RPC-4000 was a {% dictionaryLink "drum-memory", "drum-memory" %} computer · a class of machine in which the main storage was a rotating magnetic drum. Instructions and data lived on the same drum tracks. The processor had no cache; it read each instruction off the spinning surface. Where a programmer placed code on the drum determined how long the processor waited between instructions. Place the next instruction at exactly the right angular position and the drum delivers it the moment the processor is ready. Place it wrong and the machine waits through nearly a full rotation; the difference in execution speed was roughly a factor of fifty.

Mel Kaye was extraordinary at this. He memorized track layouts. He placed instructions with rotational precision that made his programs run at speeds other programmers could not approach. Nather's description of this skill is the poem's most reliable section: the optimization practice was real, the machine existed, and those speed differences were documented fact.

The RPC-4000's {% dictionaryLink "instruction word", "instruction-word" %} is 32 bits wide. Reading from the least-significant to most-significant end:

| Bits | Field | Width |
|------|-------|-------|
| 0–4 | Command (opcode) | 5 bits |
| 5–17 | Operand address | 13 bits |
| 18–30 | Next-instruction address | 13 bits |
| 31 | Index tag | 1 bit |

One notable feature of this design: each instruction word contains the address of the *next* instruction to execute, not just the current operation's operand. This is what made rotational optimization possible · a programmer could specify exactly which drum track the processor should fetch next, threading execution through the drum's surface with geometric precision. This address field is also relevant to the alternative mechanism discussed below.

## Two Reasons the Hack Can't Work

Nather describes a specific chain of events. The array index overflows past the last element; the carry ripples through the index-tag bit; the index-tag bit carries into the {% dictionaryLink "opcode", "opcode" %} field; the instruction type changes. Two researchers, working independently from the RPC-4000 hardware reference manual, found this chain broken at its foundation.

**The carry goes the wrong direction.** Arithmetic overflow carries from lower-significance bits toward higher-significance bits. On the RPC-4000, the command field sits at the *least-significant* five bits of the instruction word (bits 0–4). The operand address sits immediately above it (bits 5–17). Overflow from the operand address field carries *upward* · away from the command field, toward higher bit positions. The index-tag bit sits at position 31, the most-significant end, at the far opposite pole of the word from the command.

For Nather's mechanism to work, the index-tag would need to be sandwiched between the operand address and the command field in bit-significance order · a waypoint the carry passes through on its way to mutate the instruction type. On the actual RPC-4000, the command and the index-tag are at opposite ends of the word, and overflow flows in one direction only. There is no path from address overflow through index-tag to command field; the carry never gets near it.

**Track 127 is exactly the wrong place for a data array.** Nather writes that Mel placed his array "near the top of memory — the largest locations the instructions could address." This placement is essential to the story: the index must reach the highest addressable location before overflowing.

On the RPC-4000, the highest addresses correspond to track 127 of the drum. Track 127 holds exactly 8 words. Those 8 words functioned as the machine's closest equivalent to CPU registers · the fastest storage locations on the drum, used for intermediate calculations and scratch values by programmers who cared about performance. A programmer like Mel, who arranged entire programs around drum timing, would treat track 127 as precious scratchpad. Parking a working data array there would mean surrendering the machine's fastest storage to non-register use; that is the opposite of every instinct a speed-obsessed programmer would have.

The detail that makes the overflow plausible · placing the array at high addresses · is also the detail that makes the performance story impossible. Both impossibilities were reached independently: the analysis at {% externalLink "e-basteln.de", "https://www.e-basteln.de/computing/rpc4000/storyofmel/" %} derives them from the bit-field layout; the reconstruction at {% externalLink "melsloop.com", "https://melsloop.com/docs/the-story-of-mel/pages/mels-hack-the-missing-bits" %} arrives at the same conclusions through independent methodology. Two researchers, one hardware manual, same result.

## The Hack That Could Work

The researchers did not stop at falsification. They asked a better question: is there *any* mechanism on the RPC-4000 by which arithmetic overflow could produce an opcode change and redirect control to address zero?

The answer is yes · through a different code layout than Nather described.

Recall that the instruction word contains a next-instruction address field alongside the operand address. Both are 13-bit fields embedded in the same 32-bit word. If the loop body is arranged so that overflow in the right field carries through into the next-instruction address bits · the bits that control where execution goes after the current instruction · the resulting word can alter control flow in ways that look, from the outside, like exactly what Nather described. The carry produces a different kind of mutation than Nather specified, but a real one.

The poem's underlying insight is sound. On machines using {% dictionaryLink "self-modifying code", "self-modifying-code" %} and fixed-width instruction words, arithmetic overflow is a programmable event that can change what an instruction *means*, not just an error condition. On a drum-memory machine where code and data share the same rotating surface, where every word is simultaneously a potential instruction and a potential operand, the boundary between arithmetic and control flow is genuinely thin.

Mel almost certainly did something in this family. What Nather recalled · writing twenty-plus years later, without being a machine-code programmer himself · was a reconstruction of a trick he had witnessed but never fully reverse-engineered. He grasped the essence and built a plausible implementation narrative around it. That narrative became the text. The text became scripture.

## What Breaks Down When Knowledge Travels

The question isn't whether Nather was wrong. He was, about the mechanism. The more interesting question is why this kind of error occurs, why it persists without correction, and what it reveals about how a field accumulates knowledge.

Nather wrote the poem approximately twenty years after witnessing Mel's work. His career was in astronomy and astronomical software; he was not a machine-code programmer. He had genuine appreciation for what he observed but not a complete internal model of the hardware. He grasped the insight · overflow as programmable event · and reverse-engineered a plausible mechanism consistent with his general understanding of the RPC-4000's structure. The mechanism was coherent and convincing; it fit what a reader would expect from such a machine. Nothing about it would trip an alarm for anyone who had not read the hardware manual.

The instruction-word bit-field layout · which field sits at which bit position · is not the kind of detail a non-practitioner memorizes. It erodes over twenty years. What survives is the shape of the insight, not the specifics of its implementation.

The poem then circulated within a culture that valued the insight it encoded and had no motivation to audit the hardware details. The Jargon File canonized it. It entered blog posts, conference talks, and references to foundational programming lore. Each retelling stripped another layer of epistemic hedging. The account grew more specific over time, not less; each narrator crystallized the story into its most coherent form, filling gaps with plausible detail that no one had reason to question.

This is how technical folklore propagates: by essence, not by specification. The core insight · that on this class of machine, a programmer could use arithmetic to alter control flow · survived intact. It is genuinely true of drum-memory computing and the era in which it was practiced. The mechanism · which bits, which fields, which track · accumulated plausible but incorrect specificity without anyone noticing, because the spirit of the story was always true enough.

The pattern is not unique to Mel's story. Consider any piece of received engineering wisdom about memory models, compiler optimization, OS scheduling, or network protocol behavior. The essence of the wisdom is usually right; that is why it spread. The precise trigger condition, the exact implementation path, the specific bit that flips: these are where drift accumulates. And unlike Mel's case, most folklore never gets a careful forensic reconstruction.

## The Invitation

The RPC-4000 hardware manual exists. It is in archives, accessible to anyone who wants to check. Fourteen minutes with that document would have revealed both impossibilities at any point since 1983. The fact that no one checked for forty years is not a failure of intelligence; it is evidence that the spirit of the insight was compelling enough to make verification feel unnecessary.

Primary sources tend to be more interesting than the legends they spawn. They contain real constraints, real trade-offs, and the details that legends iron flat. The forensic analysis of the RPC-4000 goes beyond correcting a poem. It is a richer account of what it meant to program a machine where code and data shared a rotating drum, where execution speed depended on angular geometry, and where the relationship between arithmetic and control flow was not a metaphor but a physical fact about how the instruction word was laid out.

Mel's trick was real. Nather's account of the mechanism was wrong. But what survived · that a programmer could understand the machine so completely that arithmetic *became* control flow · came through intact.

That is the legend worth keeping.

---

**Further reading:** {% externalLink "Dissecting the Story of Mel", "https://www.e-basteln.de/computing/rpc4000/storyofmel/" %} (e-basteln.de) · {% externalLink "Mel's Hack: The Missing Bits", "https://melsloop.com/docs/the-story-of-mel/pages/mels-hack-the-missing-bits" %} (melsloop.com) · {% externalLink "Macho Programmers, Drum Memory, and a Forensic Analysis", "https://www.freecodecamp.org/news/macho-programmers-drum-memory-and-a-forensic-analysis-of-1960s-machine-code-6c5da6a40244/" %} (FreeCodeCamp)
