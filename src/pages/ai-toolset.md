---
pagination:
  data: supportedLocales
  size: 1
  alias: locale
layout: page.njk
title: "{{ 'nav.aiToolset' | i18n }}"
description: "{{ 'aiToolset.description' | i18n }}"
permalink: "{{ locale }}/ai-toolset/"
---

{% if locale == 'en-us' %}
# AI Toolset

This page contains my curated collection of AI tools and services that I use for various tasks. I regularly update this list based on my experience and testing.

## Development & Programming

- {% externalLink "Claude Code", "https://docs.anthropic.com/en/docs/claude-code" %} with specialized agents
- {% externalLink "Aider", "https://aider.chat/" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}
- {% externalLink "Cline", "https://github.com/cline/cline" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}

## Research

- {% externalLink "Perplexity", "https://www.perplexity.ai/" %}; I use different models to compare responses
- {% externalLink "Claude Desktop", "https://claude.ai/desktop" %}

## Task automation

- self-hosted {% externalLink "n8n", "https://n8n.io/" %}
- {% externalLink "openhands", "https://github.com/All-Hands-AI/OpenHands" %}

---

*Last updated: July 2025*

*This toolset reflects my personal experience and preferences. Your needs may vary.*

{% elif locale == 'el' %}
# AI Toolset

This page contains my curated collection of AI tools and services that I use for various tasks. I regularly update this list based on my experience and testing.

## Development & Programming

- {% externalLink "Claude Code", "https://docs.anthropic.com/en/docs/claude-code" %} with specialized agents
- {% externalLink "Aider", "https://aider.chat/" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}
- {% externalLink "Cline", "https://github.com/cline/cline" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}

## Research

- {% externalLink "Perplexity", "https://www.perplexity.ai/" %}; I use different models to compare responses
- {% externalLink "Claude Desktop", "https://claude.ai/desktop" %}

## Task automation

- self-hosted {% externalLink "n8n", "https://n8n.io/" %}
- {% externalLink "openhands", "https://github.com/All-Hands-AI/OpenHands" %}

---

*Last updated: July 2025*

*This toolset reflects my personal experience and preferences. Your needs may vary.*

{% elif locale == 'tr' %}
# AI Toolset

This page contains my curated collection of AI tools and services that I use for various tasks. I regularly update this list based on my experience and testing.

## Development & Programming

- {% externalLink "Claude Code", "https://docs.anthropic.com/en/docs/claude-code" %} with specialized agents
- {% externalLink "Aider", "https://aider.chat/" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}
- {% externalLink "Cline", "https://github.com/cline/cline" %} with {% externalLink "OpenRouter", "https://openrouter.ai/" %}

## Research

- {% externalLink "Perplexity", "https://www.perplexity.ai/" %}; I use different models to compare responses
- {% externalLink "Claude Desktop", "https://claude.ai/desktop" %}

## Task automation

- self-hosted {% externalLink "n8n", "https://n8n.io/" %}
- {% externalLink "openhands", "https://github.com/All-Hands-AI/OpenHands" %}

---

*Last updated: July 2025*

*This toolset reflects my personal experience and preferences. Your needs may vary.*

{% endif %}