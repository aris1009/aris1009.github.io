---
layout: article.njk
title: "Context Graphs: AI's Missing Decision Layer"
description: "Learn why context graphs are transforming enterprise AI by capturing decision traces · the missing layer between what happened and why it happened."
date: 2026-01-23
keywords: ["context graphs", "AI agents", "decision traces", "enterprise AI", "systems of record", "knowledge graphs", "AI infrastructure", "decision lineage", "agent autonomy", "context engineering"]
tags: ["AI", "enterprise-ai", "infrastructure", "knowledge-graphs", "ai-agents", "data-architecture", "enterprise-architecture", "ai-governance"]
difficulty: intermediate
contentType: opinion
technologies: []
locale: en-us
permalink: /blog/en-us/context-graphs-ai/
---

**TL;DR:**
- {% dictionaryLink "Context graphs", "context-graph" %} capture *why* decisions were made, not just *what* happened
- They bridge the gap between formal {% dictionaryLink "systems of record", "systems-of-record" %} and tribal knowledge in Slack threads
- {% externalLink "Foundation Capital", "https://foundationcapital.com/" %} calls this a trillion-dollar opportunity as {% dictionaryLink "AI agents", "ai-agent" %} need {% dictionaryLink "decision traces", "decision-trace" %} to scale autonomy
- The debate: are systems of record enough (Jamin Ball), or do we need a new data category (Foundation Capital)?

---

## The What vs Why Gap

Here's the problem with enterprise data right now.

Your {% dictionaryLink "CRM", "crm" %} knows a deal closed at 20% discount. That's the *what*.

It has no idea *why* the discount was approved. That's the gap.

The why lives in:
- Slack threads where someone mentioned the customer threatened to churn
- A hallway conversation where your boss gave you a thumbs up
- That one email thread where finance agreed to the exception
- Your head, because you've seen this pattern before with healthcare companies

This is what Foundation Capital calls "decision traces" · the missing layer that actually runs enterprises.

## What Are Context Graphs?

A context graph is a queryable record of decision traces stitched across entities over time.

Think of it like this: systems of record capture state (the 20% discount exists), but context graphs capture decision lineage (why the discount was allowed).

The distinction matters more as AI agents take on actual work.

Agents don't just need data. They need to understand precedent, exceptions, approval chains, and cross-system reasoning that led to past decisions.

From the Foundation Capital essay:

> "Agents don't just need rules. They need access to the decision traces that show how rules were applied in the past, where exceptions were granted, how conflicts were resolved, who approved what, and which precedents actually govern reality."

This is the what vs why gap in practice.

## The Debate: Systems of Record vs Context Graphs

The conversation started with Jamin Ball's essay "Long Live Systems of Record" in December 2025.

Ball's point: before agents, you need canonical data. If your sales team and finance team disagree on what ARR means, agents will fail.

He writes:

> "Anyone who has spent time inside a large company knows how messy this gets in practice. Take something as simple as what is our ARR? Ask sales and you will get one number. Ask finance and you get another with a different set of exclusions and adjustments."

Ball argues that fixing this, rationalizing what the correct answer is and where it lives, is unglamorous but critical work.

Foundation Capital agrees with this. But they add something crucial.

Even if you reconcile all your systems of record, you're still missing an entire category of information.

From their essay:

> "Ball's framing assumes the data agents need already lives somewhere, and agents just need better access to it. That's half the picture. The other half is the missing layer that actually runs enterprises · the decision traces, exceptions, overrides, precedents, and cross-system context that currently lives in Slack threads, deal conversations, escalation calls, and people's heads."

This is where context graphs come in.

## How Context Graphs Work: Concrete Examples

Let's make this real with examples from the Foundation Capital essay.

### Exception Logic in People's Heads

"We always give healthcare companies an extra 10% because their procurement cycles are brutal."

That's not in your CRM. It's tribal knowledge passed down through onboarding conversations.

A context graph would capture this as a decision trace: healthcare vertical + long procurement cycle = discount exception pattern.

### Precedent from Past Decisions

"We structured a similar deal for Company X last quarter. We should be consistent."

This lives in someone's memory or buried in old email threads.

A context graph makes precedent searchable. Your renewal agent can query: "Show me similar deals in this vertical from the past 6 months."

### Cross-System Synthesis

A human looks at:
- Data in {% externalLink "Salesforce", "https://www.salesforce.com/" %} (account health score)
- Open escalations in {% externalLink "Zendesk", "https://www.zendesk.com/" %} (3 critical tickets)
- Slack thread where someone flagged churn risk
- {% externalLink "PagerDuty", "https://www.pagerduty.com/" %} incidents (2 SEV1 outages last month)

They synthesize all of this in their head and decide to escalate to tier 3 support.

The record only says "escalated to tier 3."

The context graph has the full decision trace · what inputs were considered, how they were weighted, who made the call.

### Approval Chains Outside Systems

Your boss walks by your desk. You ask if you can add 5% to the discount. They give you a thumbs up and keep walking.

The CRM only shows the final price. Not who approved the deviation or why.

Context graphs capture these informal approval chains if agents are in the execution path.

## A Real Scenario: The Renewal Agent

Here's how Foundation Capital illustrates this in practice.

A renewal agent proposes a 20% discount.

Policy caps renewals at 10% unless a service impact exemption is approved.

The agent:
1. Pulls three SEV1 incidents from PagerDuty
2. Finds an open "cancel unless fixed" escalation in Zendesk
3. Locates the prior renewal thread where a VP approved a similar exemption last quarter
4. Routes the exception to finance with all this context
5. Finance approves

The CRM ends up with one fact: 20% discount.

The context graph has:
- Why the exception was needed (service impact)
- What precedent existed (last quarter's VP approval)
- Who approved this time (finance)
- What evidence justified it (SEV1 incidents + Zendesk escalation)

Over time, these records form patterns.

The agent learns: service impact + precedent + escalation severity = discount exception path.

Next time, it can route similar cases automatically because the decision trace is queryable data.

## Design Philosophy: Predefined vs Emergent

One of the most interesting follow-ups came from the Cogent Enterprise substack.

Their argument: don't predefine context graph schemas.

Traditional {% dictionaryLink "knowledge graphs", "knowledge-graph" %} fail because they require designing structure up front. Someone has to sit in a workshop and decide what entities matter and how they relate.

Context graphs invert this.

Agents act as "informed walkers" through your decision landscape. As they solve problems · traversing APIs, querying docs, reviewing past tickets · they discover the organizational ontology on the fly.

Each trajectory leaves a trace:
- Which systems were touched together
- Which data points co-occurred in decision chains
- How conflicts were resolved

Accumulate thousands of these walks and the organizational schema reveals itself from actual usage patterns rather than predetermined assumptions.

Example: imagine your company has a policy that in practice gets broken almost every time.

The exception isn't actually the exception. It's just the rule in practice.

If you predefined your context graph based on formal policy, you'd miss this. But if agents discover it through actual execution traces, they'll surface the policy-in-practice rather than the policy-on-paper.

This is powerful.

## Where Do Humans Fit?

Box CEO Aaron Levie wrote about this in his essay "The Era of Context."

His key point: if everyone has access to the same AI talent (these agentic superintelligences), what differentiates companies?

Context.

Levie writes:

> "We imagined that AI systems would adapt to how we work. But it turns out due to their extreme power and inherent limitations, we will instead adapt to how they work. This means we will have to optimize our organizations and workflows to best enable context for agents to be successful."

The individual contributor of today becomes the manager of agents in the future.

Their responsibilities:
- Providing oversight and escalation paths
- Coordinating work between agents
- Guiding agents with the right context
- Making judgment calls that break patterns

Decision traces · the what context graphs capture · are the most uniquely human part of how work gets done.

They're the decisions that break rules or break out of patterns. The judgment calls that respond to reality as it presents itself, not as you imagined it.

## Strategic Implications for 2026

Foundation Capital calls context graphs a trillion-dollar opportunity.

Here's why:

**Early mover advantage in decision trace capture.** If agents naturally create context graphs as they execute work, companies that deploy agents early will have richer decision histories.

**Context as competitive moat.** You can copy someone's tech stack. You can't copy their decade of decision traces showing how they actually operate.

**New infrastructure category.** Just like data warehouses emerged to rationalize operational data, context graph platforms will emerge to capture and query decision lineage.

**Governance and observability.** As agents take on more autonomy, being able to audit "why did the agent do this?" becomes critical. Context graphs make autonomy debuggable. If you're concerned about {% internalLink "AI agent security risks", "/blog/en-us/mcp-security/" %}, decision trace audit logs are part of the answer.

This is context engineering · designing systems to get agents access to the right data and ensuring they can interoperate on that data.

It's one of the key predictions for enterprise AI in 2026.

## The Missing Layer

Let me bring this back to the core insight.

Systems of record are good at state. This deal closed. This ticket was escalated. This price was set.

They're bad at decision lineage. Why was the deal structured this way? Why was this ticket escalated? Why was this price approved?

Context graphs make the "why" queryable.

They turn exceptions into precedent. They make approval chains visible. They capture the cross-system reasoning that humans currently do in their heads.

As agents scale, this becomes the layer that actually runs enterprises.

Not just the data. The decision traces.

If you're building enterprise AI systems in 2026, start thinking about how you'll capture decision context · not just operational state.

That's the missing layer.

---

## Sources

- {% externalLink "AI's Trillion-Dollar Opportunity: Context Graphs", "https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/" %} · Foundation Capital (Jay Gupta, Ashu Garg)
- {% externalLink "Long Live Systems of Record", "https://cloudedjudgement.substack.com/p/clouded-judgement-121225-long-live" %} · Jamin Ball / Clouded Judgement
- {% externalLink "Box CEO Aaron Levie on AI's Era of Context", "https://techcrunch.com/2025/09/11/box-ceo-aaron-levie-on-ais-era-of-context/" %} · TechCrunch interview
