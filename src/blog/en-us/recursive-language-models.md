---
layout: article.njk
title: "Smarter Scaffolding Beats Bigger Models"
description: "MIT's recursive language model technique offers unlimited context through clever infrastructure · no model changes needed. Why scaffolding innovations matter more than scaling."
date: 2026-01-22
keywords: ["recursive language models", "RLM", "context window", "LLM scaffolding", "MIT research", "inference scaling", "context rot", "RAG", "long context"]
tags:
  - ai
  - llm
  - research
  - opinion
difficulty: intermediate
contentType: opinion
technologies: []
type: article
locale: en-us
permalink: /blog/en-us/recursive-language-models/
---

The most exciting AI breakthroughs aren't coming from bigger models. They're coming from smarter scaffolding.

MIT researchers just published a paper that should make every AI developer stop and think. Not because they trained a new model· they didn't change model weights at all. Instead, they built infrastructure around existing models that lets them process unlimited context with better quality than the base model. And often at lower cost.

Let that sink in. A smaller model with clever tooling outperformed a larger model. No fine-tuning required.

## The Problem Everyone has Seemed to Accept

Every LLM has a {% dictionaryLink "context window", "context-window" %}. When you submit a prompt, there's a hard limit on how much text you can include. GPT-5 can handle around 256K tokens. Claude supports even more. But the dirty secret of the marketing materials that isn't mentioned: **larger context windows don't mean better performance**.

This phenomenon has a name: context rot.

Chroma's research team documented this extensively. As you stuff more tokens into the context window, model performance degrades. Not because the model can't see the information· it's technically all there. The problem is architectural. Attention mechanisms naturally focus on the beginning and end of the input while de-emphasizing the middle.

Stanford researchers quantified this in their "Lost in the Middle" paper. With 20 documents totaling around 4,000 tokens:

- Accuracy hit 70-75% when relevant info sat at positions 1 or 20
- Accuracy dropped to 55-60% when the same info was buried in the middle
- That's a 15-20 percentage point drop based entirely on position, not content quality

The U-shaped performance curve is real. Models work best at the edges and worst in the middle. And this holds true across GPT, Claude, Gemini, no model is immune.

I experienced this firsthand last year when running multiple {% dictionaryLink "MCP", "mcp" %} servers simultaneously. The context window would fill up with tool definitions, conversation history, and retrieved content and task success rates dropped noticeably. The fix wasn't switching to models with larger context window. It was optimizing context usage through progressive disclosure, only loading what was immediately needed.

Why? It's baked into the attention mechanism. Positional encodings naturally prioritize tokens at the beginning and end while de-emphasizing middle content. You can advertise a million-token context window, but if the model can't reliably use information from position 500,000, what's the point?

## The Band-Aid of Today

The common solution today is context condensation. When the context window starts filling up, you summarize. Use an LLM to compress what's in there, shrink it down, and keep going.

It works. Sort of.

The problem is every summarization pass loses information. You're compressing, and compression is inherently lossy. Sometimes losing detail doesn't matter. But often it very much does.

Imagine reading a long story, summarizing it, then summarizing the summary, then doing that again and again. Eventually you've lost the nuance. The specific details that made the story meaningful are gone.

For simple conversational tasks, this is fine. But for deep research? For code repository understanding? For any task requiring synthesis across hundreds of documents? Compaction introduces errors that compound.

## The Obvious-in-Retrospect Insight

The MIT team asked a different question: what if we stopped treating long prompts as neural network input entirely?

Their solution is called Recursive Language Models (RLMs). The core insight is almost embarrassingly simple once you hear it.

Instead of feeding that massive prompt into the model's context window, they save it to a file. A plain text file. Then they give the model tools to search through that file programmatically.

That's it. That's the breakthrough.

The prompt becomes an environment the model can navigate, not a blob of text it has to process all at once. The model writes Python code to query the text, find relevant sections, and recursively dig deeper when needed.

It works like this:

1. The full input gets loaded into a Python REPL as a string variable
2. The actual LLM never sees that string directly in its context
3. Instead it receives a system prompt explaining how to read slices of the variable
4. The model can write helper functions, spawn sub-LLM calls, and combine results
5. When it finds something relevant, it can recursively query that section for more detail

The "recursive" part is key. The model doesn't just do one search. It goes deep. Finds a chapter that looks relevant, queries that chapter specifically, finds a section within it, goes deeper still. Then comes back up with synthesized findings.

## The Hard-to-Ignore Results

RLMs successfully handle inputs up to two orders of magnitude beyond model context windows. We're talking 10 million tokens when the base model can only handle 256K natively.

But size isn't the impressive part. Quality is.

The MIT team tested RLMs against four distinct task categories:

**Deep research tasks**: questions requiring synthesis across many documents. Think academic literature reviews or competitive analysis requiring comparison of multiple sources.

**Information aggregation**: tasks like "list all items matching X criteria" across massive document sets. The kind of work where missing even one relevant mention means failure.

**Code repository understanding**: questions about how functions interact across a large codebase. If you've ever tried to understand a complex project by reading function calls that reference other function calls that reference still more functions, you know this pain. I've had multiple instances where the context window filled up just from research and planning, forcing me to break plans into chunks, then implement each chunk in separate chat sessions. That's a context limitation problem masquerading as a workflow one.

**Synthetic pairwise reasoning**: the hardest category. Tasks requiring the model to find and connect information scattered across different parts of the input. Even frontier models fail badly on these.

For that last category, an RLM using GPT-5-mini outperformed GPT-5 on the OOLONG benchmark by more than double the number of correct answers. Let me repeat that: the smaller, cheaper model beat the larger one. The difference was purely in the scaffolding.

Needle in a haystack tests, where you hide a fact somewhere in a massive document and ask the model to find it, are basically solved by modern models. That's not the challenge anymore. The challenge is OOLONG-style tasks where you need to synthesize information from multiple locations, compare facts across sections, and reason about relationships that span the entire input.

RLMs shine here precisely because they can go deep. Find section A, query it, find section B, query it, compare the two, go deeper into specific paragraphs, come back up with a synthesized answer.

The cost story is equally compelling. GPT-5-mini ingesting 6-11 million input tokens costs $150-275. RLM with GPT-5 averages $99 per query while outperforming both summarization and retrieval baselines by over 29%.

Why is it cheaper? Because the model isn't loading millions of tokens into its attention mechanism every time. It's selectively viewing context only pulling in what's relevant for each sub-query.

There's a caveat here: cost variance is high. Recursive systems are unpredictable. Sometimes the model goes shallow and finishes quickly. Sometimes it spirals deep into nested queries. The 95th percentile costs can spike significantly. But on average, you're still coming out ahead while getting dramatically better results.

## How This Differs From RAG

If you're thinking "this sounds like {% dictionaryLink "RAG", "rag" %}," you're half right. Retrieval-Augmented Generation also avoids stuffing everything into the context. It retrieves relevant chunks and only feeds those to the model.

But there are crucial differences.

RAG uses a separate retrieval system, typically vector embeddings, to find relevant chunks before the LLM ever sees the query. The model doesn't control what gets retrieved. It just gets what the retrieval system decided was relevant.

RLMs put the model in control. The model decides what to search for, examines results, and iteratively refines its queries. It can go deep on specific sections, backtrack, try different approaches. The search strategy emerges from the model's reasoning, not a pre-built pipeline.

RAG also struggles with synthesis tasks. It retrieves chunks that match the query, but what if the answer requires combining information from chunks that don't individually match? RLMs handle this naturally through recursive decomposition· breaking the main question into sub-questions, answering each, then synthesizing.

Think of it this way: RAG is a librarian handing you books that match your keywords. RLM is a researcher who reads books, takes notes, cross-references sections, and builds an argument.

Both have their place. RAG is simpler and faster for straightforward factual retrieval. RLMs shine for complex reasoning tasks where the search strategy itself is part of the problem.

## What This Means for AI Development

The pattern keeps repeating: RAG improves factual accuracy without retraining. {% internalLink "Tool use", "/blog/en-us/mcp-security/" %} lets models interact with APIs they could never learn internally. Code execution lets models verify their own outputs. Now RLMs prove that even context window limitations are a scaffolding problem, not a model problem.

The most impactful work in AI right now isn't happening at the model layer. It's happening at the infrastructure layer.

## What This Actually Enables

With large context, use cases that were previously impossible become routine:

**Entire codebases as context.** Not snippets. Not RAG-retrieved fragments. The whole thing. Ask questions that require understanding how module A interacts with module B through module C. The model can trace those connections by querying recursively.

**Multi-document research.** Load a hundred papers, ask synthesis questions. "What do these studies agree on? Where do they contradict?" The model searches, compares, synthesizes.

**Long-horizon agent tasks.** Agents need memory of everything they've done. With RLMs, that history doesn't rot. The agent can query its own past actions, find relevant precedents, avoid repeating mistakes.

**Massive dataset analysis.** Load millions of rows as text. Let the model write queries, examine results, refine hypotheses. No pre-processing pipeline required.

## The Developer Takeaway

If you're building with LLMs, stop waiting for the next model release. Start building better harnesses around what you already have.

Are you hitting context limits? Before you compress and lose information, consider whether your prompt could be treated as an environment instead. The RLM paper is model-agnostic· anything that can write code and call itself recursively works. GPT, Claude, Qwen, open-source models. The technique transfers.

## The Bigger Picture

We spent the past year assuming that intelligence improvements meant model improvements. Bigger parameters. More training data. That assumption is breaking down. The scaffolding thesis proved you can wrap a moderately intelligent model in sufficiently sophisticated tooling and you get capabilities the larger model doesn't have at all.

I have been thinking for a while now the models we have are smart enough. We just need to build better tools around them. That's way more exciting (and less power-hungry) than waiting for GPT-6.
