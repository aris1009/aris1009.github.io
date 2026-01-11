---
layout: article.njk
title: "Anthropic Announces Rate Limits: How to Maximize Your AI Coding Productivity"
description: "Strategies to optimize your agentic AI usage after Anthropic's new rate limits. Learn to extend coding sessions and get production-ready software without burning through quotas."
date: 2025-07-29
keyword: claude-code, anthropic
difficulty: expert
contentType: opinion
technologies: ['Claude Code']
type: article
locale: en-us
permalink: /blog/en-us/dealing-with-rate-limits/
draft: false
---

## Rate limits? Again?

Only a few hours after I published my {% internalLink "previous blog", "/blog/en-us/get-most-out-of-claude-code/" %}, Anthropic had the courtesy to share the dreaded email I was expecting rather sooner than later:

> Next month, we're introducing new weekly rate limits for Claude subscribers, affecting less than 5% of users based on current usage patterns. 
-- Anthropic, verbatim

I can't say I was surprised and I admit it with a bit of sadness. As the world, the AI markets and the investors realize the real cost of agentic AI, we will only see rate limits tightening, while subscription prices increasing. 

You don't have to be a victim of these changes. The last couple months I have been hitting rate limits daily, I've learned how to extend my agentic coding sessions by a few more hours and get production-ready software without burning through my quota in 20 minutes like others do. 

I will lay out my thoughts on the following issues:
- How did we get here?
- Who caused this?
- What can we do?

## How did we get here?

Agentic AI coding tools have been brewing since the start of the year. There were a few exceptions before that time, tools like {% externalLink "Tabnine", "https://www.tabnine.com/" %} were ahead of their time, but nothing compares to what we have now: {% externalLink "Claude Code", "https://claude.ai/code" %}, {% externalLink "aider", "https://github.com/paul-gauthier/aider" %}, {% externalLink "openhands", "https://github.com/All-Hands-AI/OpenHands" %}, and {% externalLink "cline", "https://github.com/cline/cline" %}.

Every major LLM provider rushed to build the best agentic code assistant. They wanted a piece of the massive software engineering market. And they needed market adoption so they can refine their product; a classic case of pushing debt to the future.

Agentic AI changed how we develop software in two key ways:

**For experienced engineers:** They became more productive by doing what they always did: provide guidance and direction. The difference? Now they guide AI agents instead of managing junior and mid-level engineers.

**For hobbyists and aspiring developers:** They can bootstrap projects faster than ever before. Sure, these projects often have issues, but that's a separate discussion.

Both scenarios are actually great. Everyone should learn basic scripting to make their lives easier.

But here's where things get messy. Some wannabe-developer influencers (let's call them WBDIs) create misleading content. They lure people into thinking their chaotic development approach is how software should be built.

Most WBDIs share two traits:
- They create unoriginal project clones just to generate traffic
- They brag about maxing out expensive AI subscriptions, comparing that cost to what {% dictionaryLink "API", "api" %} calls would have been

## Who caused this

Here's another way to read Anthropic's email: 95% of users are paying for the damage that 5% did.

You've probably seen the content out there, posts on r/anthropic and r/claude starting with "Anthropic is going to hate me for this, but I max out my rate limits every single day."

Anthropic has been more generous with rate limits than other providers. I'm one of those people who regularly hits limits (I have a pro subscription and use Sonnet 4 daily). But here's the key difference:

**My approach:** A few hours of planning, then Claude Code develops solid production-ready software.

**The problematic approach:** WBDIs max out their plan in 20 minutes. They either don't know how to use their tools efficiently, or they think burning through quota fast equals maximum value. What a waste of time, inference, and drinking water!

But I don't entirely blame them --AI is moving so fast that best practices haven't caught up. Most people don't know what metrics indicate efficient usage.

That's where the next section comes in. Let me share what I've learned.

## What can we do

We need to be more stoic and disciplined. Despite rate limits, you can still get excellent value from your subscription. The key is being strategic instead of wasteful.

I've stayed on the Pro plan instead of upgrading to Max because these techniques work. Over the past few months, I've consistently extended my daily coding sessions while producing production-ready software.

The strategies below are organized by skill level. Pick your starting point and work your way up:

Click here to view my most up-to-date {% internalLink "agentic AI setup", "/en-us/ai-toolset/" %}.

### Level 1: Beginner rate limit optimizer

Applying the Pareto Principle, here's the bare minimum you can do:

**1. Track your usage data**  
Use a monitoring tool for Claude Code usage. I personally use {% externalLink "sniffly", "https://github.com/chiphuyen/sniffly" %} because it runs locally and keeps your data private. You need this data to identify patterns and optimize later.

**2. Use Claude Code strategically**  
Out of all agentic coding tools, Claude Code is, in my humble opinion, superior for actual code generation. Save it for implementing and use other tools (eg {% externalLink "Perplexity", "https://www.perplexity.ai/" %}) for research, planning, and questions. This alone can double your effective coding time. Pairing two cheaper subscriptions on different providers is better than a more expensive one on the same provider.

**3. Master the 5-hour window system**  
Claude's rate limits work in 5-hour fixed windows. Here's the key insight:

- First message at 6:18 AM → Window resets at 11:00 AM
- Next message at 11:34 AM → Window resets at 4:00 PM  
- Next message at 4:15 PM → Window resets at 9:00 PM

This means you can squeeze **three full rate limit windows** into a single day if you time your first messages right --easily automatable. {% externalLink "Claude Desktop", "https://claude.ai/download" %} counts toward the same limits.

### Level 2: Journeyman rate limit optimizer

This level requires experience you can only get through trial and error. You need to use AI coding tools long enough to understand their patterns and limitations.

**1. Optimize context size for better responses**  
You understand that a smaller active context means higher quality responses and smaller inference cost, leading to longer coding sessions untl the rate limits. You may compact the chat with custom prompts based on your task, and always clear the context for the next task.

**2. Minimize wasteful compaction**  
You realize that context compaction is an operation that wastes tokens, since it doesn't produce code, thus you don't do it often and don't have long running chats. You have the foresight to break down your task into smaller chunks that can be completed with a smaller active context window that won't require compaction.

**3. Maximize prompt caching benefits**  
You take advantage of prompt caching and group execution of related tasks that will mostly require the same reads in such a way that will increase your cache usage, leading to less impact on your rate limit. Claude code can reduce input tokens by up to 90% and you have data from level 1 to visualize this.

**4. Schedule around your availability**  
 Agents need oversight, but not constant attention. You optimize the usage of your rate limit around your calls/meetings, so inference can run in the background while you are talking with other people. My personal advice is to avoid multi-tasking and focus on one thing at a time; agents excel here to support you because they can work unattended.

### Level 3: Master rate limit abuser

You are a professional software developer. Probably you have already worked across multiple companies, technologies, projects. You understand that fundamentally AI is just another tool to a means. You know when, where, and why an AI Agent falls short, know when to stop it, and when to manually write code yourself because it will be faster. At this level you start analyzing your data from level 1, going over your chat history when the agent fails, or actively monitoring the context window to understand why it balloons.

**Diagnostic Checklist** *(Numbers are my benchmarks, calibrate your own)*

Use your Level 1 monitoring data to check these warning signs:

**🔴 High Interruption Rate (>10%)**
- **Problem:** You stop the agent mid-task to redirect
- **Root Cause:** Tasks aren't well-defined enough
- **Fix:** Break down requests into smaller, specific actions, ensure you have proper context

**🔴 High Error Rate (>5-7%)**  
- **Problem:** Agent can't find files, makes syntax errors, uses wrong tools
- **Root Cause:** Context window too full or conflicting information
- **Fix:** Start fresh conversations more often, improve project organization
- **Note:** Error rate increases as the active context window gets fuller.

**🔴 Low Tool Usage Rate (<40%)**
- **Problem:** Agent talks too much, codes too little
- **Root Cause:** Using it for research instead of implementation
- **Fix:** Save Claude Code for actual coding tasks only

**🔴 High Read Tool Usage (~60%)**
- **Problem:** Agent constantly searches for files and context
- **Root Cause:** Poor project structure or using agent for exploration
- **Fix:** Organize codebase better, use {% externalLink "git-worktrees", "https://git-scm.com/docs/git-worktree" %} for research so research data doesn't skew your usage data.

**🔴 Extreme Token Usage for Seemingly Simple Tasks**
- **Problem:** Basic requests consume massive tokens
- **Root Cause:** Too many MCP servers or missing prompt caching
- **Optimal token order:** Cache Reads > Cache Creation > Output > Input
- **Fix:** Disable unused MCP servers, verify prompt caching is enabled
