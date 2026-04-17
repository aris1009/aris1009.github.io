---
layout: article.njk
title: "My Blog Got Hijacked (Sort Of)"
description: "A war story about discovering my domain was serving a gambling site—and how the 3-hour investigation revealed it wasn't DNS hijacking at all."
date: 2026-01-17
keywords: ["web-security", "dns", "github-pages", "subdomain-takeover", "custom-domain", "host-header", "cloudflare", "domain-hijacking", "dns-debugging", "postmortem"]
tags: ["security", "web-security", "dns", "github-pages", "domain-hijacking", "postmortem", "cloudflare", "tutorial"]
difficulty: intermediate
contentType: postmortem
technologies: ['DNS', 'GitHub Pages', 'Cloudflare']
type: article
locale: en-us
permalink: /blog/en-us/github-pages-domain-hijacking/
---

## The Discovery

I noticed something alarming. Visiting `ariscodes.com` displayed a gambling site. Not my cybersecurity blog. A casino marketplace called "HOTELBET" with slot machine listings.

Meanwhile, `blog.ariscodes.com` worked perfectly—serving my actual content.

**Initial hypothesis**: DNS hijacking. Someone gained access to my Cloudflare account and pointed my domain to malicious servers.

I spent the next three hours analyzing DNS configurations, comparing solutions, modeling performance differences. The fix? Five minutes.

Here's the detective story, and what I learned about modern web security layers.

---

## Investigation Phase 1: DNS Record Analysis

First instinct: check if someone modified my DNS records.

I queried Cloudflare's {% dictionaryLink "API", "api" %}:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {name, type, content, proxied}'
```

**Root domain records:**
```json
{
  "name": "ariscodes.com",
  "type": "A",
  "content": "185.199.108.153",
  "proxied": false
}
```

Plus three more A records (185.199.109-111.153) and four AAAA records for IPv6.

**Subdomain records:**
```json
{
  "name": "blog.ariscodes.com",
  "type": "CNAME",
  "content": "aris1009.github.io",
  "proxied": false
}
```

Those IPs—`185.199.108-111.153`—belong to **GitHub Pages**. Legitimate infrastructure. Not malicious servers.

No unauthorized changes. DNS records were exactly as I'd configured them.

**This ruled out traditional DNS hijacking.**

---

## Investigation Phase 2: Four Hypotheses

If DNS pointed to legitimate GitHub Pages IPs, why was I seeing a gambling site?

1. **DNS cache poisoning** - Someone poisoned resolvers with false records
2. **ISP-level proxy caching** - My ISP cached wrong content
3. **CDN confusion** - Shared IP space causing content mixups
4. **GitHub Pages routing failure** - GitHub serving the wrong repository's content

To test these, I needed to understand how GitHub Pages routes requests.

## How GitHub Pages Works

GitHub Pages uses **Host header-based routing** (virtual hosting):

1. Client connects to GitHub Pages IP (185.199.108.153)
2. Client sends `Host: ariscodes.com` header
3. GitHub looks up which repository owns that domain
4. GitHub serves that repository's content

**The key insight**: millions of websites share the same GitHub Pages IPs. GitHub uses the Host header to determine whose content to serve.

---

## Investigation Phase 3: Root Cause Testing

Time to stop theorizing and start testing. I ran systematic experiments.

### Test 1: Direct IP with Host header

```bash
curl -H "Host: ariscodes.com" http://185.199.108.153 | head -20
```

**Result:**
```html
<!DOCTYPE HTML>
<title>HOTELBET Situs Slot Bank CIMB Rentan Mudah Jekpot Tanpa Batas</title>
```

GitHub Pages returned the gambling site.

### Test 2: Direct IP without Host header

```bash
curl http://185.199.108.153 | head -20
```

**Result:**
```html
<!DOCTYPE html>
<title>Site not found · GitHub Pages</title>
```

Without the Host header, GitHub correctly returned "Site not found."

### Test 3: Multiple DNS resolvers

```bash
dig @8.8.8.8 ariscodes.com +short
dig @1.1.1.1 ariscodes.com +short
dig @208.67.222.222 ariscodes.com +short
```

All three resolvers returned identical GitHub Pages IPs. No cache poisoning.

**The picture became clear:**
- DNS was correct
- GitHub Pages routing worked
- When I sent `Host: ariscodes.com`, GitHub served someone else's content

---

## The Root Cause: GitHub Pages Custom Domain Theft

Someone had configured their GitHub Pages repository with `ariscodes.com` as their custom domain.

**This isn't DNS hijacking. It's GitHub Pages custom domain theft.**

> **Warning:** GitHub Pages doesn't verify domain ownership when you add a custom domain.

Anyone can:
1. Create a GitHub Pages repository
2. Add your domain to their CNAME file
3. GitHub serves their content whenever someone requests your domain

If you configure DNS to point to GitHub Pages but don't claim your domain in your repository, someone else can.

---

## Why This Happened

**What I did:**
1. Configured DNS for `ariscodes.com` pointing to GitHub Pages IPs
2. Created `blog.ariscodes.com` with proper CNAME to `aris1009.github.io`

**What I didn't do:**
- Create a CNAME file in my repository claiming `ariscodes.com`

**What the attacker did:**
1. Created their own GitHub Pages repository
2. Added `ariscodes.com` to their CNAME file
3. GitHub routed my domain to their gambling site

**Why `blog.ariscodes.com` still worked:**

The subdomain uses a CNAME pointing to `aris1009.github.io`:
```text
blog.ariscodes.com → CNAME → aris1009.github.io
```

When the request reaches GitHub, the Host header is `aris1009.github.io`, not a custom domain. GitHub routes to my repository correctly.

---

## The Two-Layer Problem

Modern web architecture has multiple routing layers. I was only securing one.

**Layer 1: DNS Resolution**
```text
Query: What's the IP of ariscodes.com?
Answer: 185.199.108.153 (GitHub Pages)
✅ This layer was correct
```

**Layer 2: HTTP Content Routing**
```text
Request: GET / with Host: ariscodes.com
GitHub: Which repository owns ariscodes.com?
Answer: The gambling site
❌ This layer was hijacked
```

**DNS security measures that don't prevent this:**
- 2FA on Cloudflare (protects DNS records, not application routing)
- DNSSEC (protects DNS integrity, not content routing)
- Domain registrar lock (prevents nameserver changes, not platform hijacking)

All my DNS security was fine. The vulnerability was in GitHub's application layer.

---

## The Fix: 5 Minutes

**Option A: GitHub web interface**
1. Go to repository settings → Pages
2. Enter `ariscodes.com` as custom domain
3. Save

**Option B: CNAME file**
1. Create a file named `CNAME` in repository root
2. Add one line: `ariscodes.com`
3. Commit and push

GitHub verifies your DNS points to their IPs and associates the domain with your repository. The attacker's claim gets overwritten.

**Verification:**
```bash
curl -H "Host: ariscodes.com" http://185.199.108.153 | head -20
```

I can see my blog, not a gambling site.

---

## The Analysis Paralysis

Coming to the embarrassing part· before I ran those simple curl tests, I spent three hours on:

- Comparing three DNS configuration solutions
- Writing a 13-step security hardening plan
- Modeling performance differences (10ms variances)
- Analyzing cost ($0/month for everything)
- Worrying about vendor lock-in (irrelevant for a personal blog)

**The actual fix:**
1. Add CNAME file to repository (5 min)
2. Enable 2FA on accounts (10 min)
3. Simplify DNS to one record (15 min)

Total: 30 minutes.

> **Lesson:** Validate assumptions before deep analysis. Ten minutes of curl testing would have revealed the root cause immediately.

---

## Proportional Security

Not every project needs enterprise security. Here's what makes sense for a personal blog:

**Do this (free, high ROI):**
- Enable 2FA on Cloudflare, GitHub, email
- Claim your custom domain in GitHub Pages
- Lock domain at registrar

**Skip this (disproportionate for personal blogs):**
- DNSSEC
- CAA records
- {% dictionaryLink "Infrastructure-as-code", "infrastructure-as-code" %}
- External monitoring services ($20/month)
- Monthly security audits

Match security measures to your threat model. A personal blog isn't a bank.

---

## Is This a GitHub Bug?

**GitHub's perspective**: Working as designed. Custom domains are self-service. DNS verification happens automatically.

**Security perspective**: It's a vulnerability. No proactive domain ownership verification. Enables domain squatting. Could be used for {% dictionaryLink "phishing", "phishing" %}.

**What GitHub could do:**
- Require TXT record verification before accepting custom domains
- Notify DNS owners when someone claims their domain
- Implement dispute resolution

For now, the mitigation is simple: always claim your domain in GitHub Pages settings immediately after configuring DNS.

---

## Key Takeaways

**For GitHub Pages users:**
1. Always configure custom domains in repository settings
2. Don't rely on DNS alone to establish ownership
3. Test with curl: `curl -H "Host: yourdomain.com" http://185.199.108.153`

**For debugging similar issues:**
1. Test with and without Host headers to isolate layers
2. Check multiple DNS resolvers for cache poisoning
3. Verify platform configuration, not just DNS

**For security planning:**
1. DNS security ≠ content security
2. Shared infrastructure has shared risks
3. Test end-to-end, not just individual layers
4. Validate assumptions before analyzing solutions

---

## Tools Used

```bash
# Query DNS records via Cloudflare API
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq .

# Check DNS resolution across resolvers
dig @8.8.8.8 ariscodes.com +short
dig @1.1.1.1 ariscodes.com +short
dig @208.67.222.222 ariscodes.com +short

# Test GitHub Pages routing with Host header
curl -H "Host: ariscodes.com" http://185.199.108.153 | head -20

# Test without Host header
curl http://185.199.108.153 | head -20
```

---

## Timeline

| Time | Activity | Outcome |
|------|----------|---------|
| 0:00 | Noticed gambling site on my domain | Problem discovered |
| 0:10 | Checked Cloudflare DNS records | No unauthorized changes |
| 0:30 | Analyzed DNS configuration | Found records pointing to GitHub Pages |
| 1:00 | Hypothesized DNS hijacking | Three theories developed |
| 2:00 | Compared DNS solutions | All free, all equivalent |
| 3:00 | Finally ran curl tests | **Discovered GitHub Pages routing issue** |
| 3:10 | Identified fix | Added CNAME file |

**Analysis time**: 3 hours
**Problem solving time**: 10 minutes (after testing)

---

What appeared to be DNS hijacking was GitHub Pages custom domain theft—a vulnerability in how GitHub associates domains with repositories.

The fix was trivial. The lesson was valuable: test your assumptions before diving into analysis. Sometimes the answer is a five-minute curl test away.
