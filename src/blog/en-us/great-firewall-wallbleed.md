---
layout: article.njk
title: "The Great Firewall's Wallbleed: How a Memory Bug Exposed China's Censorship Machine"
description: "A deep dive into DNS poisoning, the Great firewall of China, and the Wallbleed vulnerability that allowed researchers to exfiltrate 5 billion packets from Chinese censorship infrastructure."
date: 2026-01-12
keyword: cybersecurity, dns, china, great-firewall, dns-poisoning, memory-safety, censorship, surveillance, vulnerability-research, network-security, wallbleed, buffer-over-read, gfw-report, digital-authoritarianism, deep-dive, intermediate, tutorial, 2026
difficulty: expert
contentType: tutorial
technologies: ['DNS']
type: article
locale: en-us
permalink: /blog/en-us/great-firewall-wallbleed/
draft: false
---

# Pretext

The Great {% dictionaryLink "Firewall", "firewall" %} (GFW) of China is a highly-sophisticated internet-censorship and surveillance program. China uses it to control access to the world wide web inside their vast territory.

What makes it unique? China combines technical blocking with cultural engineering. They built a complete domestic internet ecosystem (Baidu, WeChat, Alibaba) that reduces citizens' pressure to circumvent censorship. At the same time, they strategically degrade foreign services through infrastructure imbalances, creating natural user migration toward domestic platforms.

The GFW operates through multiple layers: {% dictionaryLink "DNS poisoning", "dns-poisoning" %}, IP blocking, and {% dictionaryLink "Deep Packet Inspection", "deep-packet-inspection" %}.

In this post I'll focus on two things:
- How the GFW performs DNS Poisoning
- What the Wallbleed vulnerability is, or rather *was* since it has been patched

But first, let's understand:

# What is Domain Name System (DNS)?

DNS is the system that resolves human-readable domain names (like google.com) to IP addresses that machines understand.

Here's the flow: you type a domain name in your browser, hit Enter, a DNS query leaves your computer, goes through DNS resolvers, eventually reaches a DNS authoritative server that maintains the domain-to-IP mappings, and finally returns the response so your browser can connect.

Replaying this request every time you visit a website is inefficient. To optimize, there are multiple cache layers: DNS resolvers, your operating system, and even your browser cache DNS responses for a preconfigured amount of time.

Cloudflare has a great article explaining how DNS works with visualizations. It also covers DNS poisoning, one of the techniques the GFW employs. Go read it: {% externalLink "DNS Cache Poisoning", "https://www.cloudflare.com/learning/dns/dns-cache-poisoning/" %}

In summary: {% dictionaryLink "DNS poisoning", "dns-poisoning" %} is polluting the DNS cache with an incorrect IP address. This results in either blocking a website or redirecting users to a malicious one.

Now let's explore how the GFW does this.

# The GFW racing to serve you a forged DNS response

The GFW uses {% dictionaryLink "DNS poisoning", "dns-poisoning" %} as a censorship tool.

DNS injectors are deployed throughout Chinese infrastructure, continuously monitoring all DNS traffic. When they detect a blacklisted domain query, they immediately transmit forged responses containing random IP addresses. These injectors are positioned geographically close to users; they need to *win the race* against legitimate responses.

The system exploits DNS caching to propagate false information through downstream servers.

Notably these injectors respond to *any* DNS traffic transiting Chinese infrastructure. This extends China's censorship influence beyond its borders.

# Checking the forged IPs

Let's roll up our sleeves and see these forged responses in action.

To follow along you'll need these CLI tools:
1. tshark - comes with {% externalLink "Wireshark", "https://www.wireshark.org/" %}, or install standalone: {% externalLink "tshark.dev", "https://tshark.dev/setup/install/" %}
2. {% externalLink "curl", "https://curl.se/download.html" %} or your HTTP client of choice
3. jq - pretty prints JSON responses (nice-to-have, skip if you want)
4. nslookup - most likely already on your system

Here's our methodology:
1. Resolve the IP of a blocked domain routing traffic *outside* of China (I'm assuming you're not in China and don't use a {% dictionaryLink "VPN", "vpn" %} that routes through China)
2. Verify who owns the resolved IP
3. Resolve the same blocked domain, but route through China
4. Verify who owns *that* IP

facebook.com is blocked in China. We'll use it as our example:

```bash
nslookup facebook.com
```

```text
Server:         1.1.1.1
Address:        1.1.1.1#53

Non-authoritative answer:
Name:   facebook.com
Address: 157.240.195.35
```

I'm using CloudFlare DNS (1.1.1.1) and got back `157.240.195.35`. Let's see who owns this IP:

```bash
curl ipinfo.io/157.240.195.35 | jq
```

```json
{
  "ip": "157.240.195.35",
  "hostname": "edge-star-mini-shv-01-mrs2.facebook.com",
  "city": "Marseille",
  "region": "Provence-Alpes-Côte d'Azur",
  "country": "FR",
  "loc": "43.2966,5.3703",
  "org": "AS32934 Facebook, Inc.",
  "postal": "13002",
  "timezone": "Europe/Paris",
  "readme": "https://ipinfo.io/missingauth"
}
```

The `org` field shows `AS32934 Facebook, Inc.` Legitimate, owned by Meta.

Now let's route our DNS query through China. First, we need a Chinese IP. Baidu will work; it's the Chinese Google counter-part:

```bash
nslookup baidu.com
```

```text
Server:         1.1.1.1
Address:        1.1.1.1#53

Non-authoritative answer:
Name:   baidu.com
Address: 111.63.65.103
Name:   baidu.com
Address: 124.237.177.164
Name:   baidu.com
Address: 110.242.74.102
Name:   baidu.com
Address: 111.63.65.247
```

Pick any of these IPs and resolve facebook.com again. I'll use `111.63.65.247`:

```bash
nslookup facebook.com 111.63.65.247
```

```text
Server:         111.63.65.247
Address:        111.63.65.247#53

Non-authoritative answer:
Name:   facebook.com
Address: 128.242.240.189
```

Different IP. Interesting. Who owns it?

```bash
curl ipinfo.io/128.242.240.189 | jq
```

```json
{
  "ip": "128.242.240.189",
  "city": "Mumbai",
  "region": "Maharashtra",
  "country": "IN",
  "loc": "19.0728,72.8826",
  "org": "AS203020 HostRoyale Technologies Pvt Ltd",
  "postal": "400017",
  "timezone": "Asia/Kolkata",
  "readme": "https://ipinfo.io/missingauth"
}
```

A bit of {% dictionaryLink "OSINT", "osint" %} reveals HostRoyale Technologies Pvt Ltd has no affiliation with facebook.com whatsoever.

This is the GFW actively intercepting our DNS queries and poisoning our cache with forged IPs *before* the authoritative DNS server can respond with the legitimate one.

Try this yourself. You'll likely get a different forged IP. I've consistently seen IPs belonging to random foreign entities, Dropbox, and even IBM. I attached a list of forged IPs in the Sources section of this article.

# Dissecting the DNS response with tshark

Let's go deeper and inspect the actual DNS packets using tshark.

tshark is a CLI tool for packet inspection. It shows us exactly what's happening under the hood.

First, identify your network interface. The name depends on your OS, whether you're on ethernet, wifi, or a virtual adapter (like one created by a {% dictionaryLink "VPN", "vpn" %}). List your adapters:

```bash
tshark -D
```

Identify your own adapter. Going forward I'll refer to it as `$ADAPTER`, its id as `$ADAPTER_ID`, and its name as `$ADAPTER_NAME`. Another command that can help:

```bash
# Linux
ip route get 1.1.1.1

# Windows (PowerShell)
Find-NetRoute -RemoteIPAddress 1.1.1.1

# MacOS, BSD, Solaris
route get 1.1.1.1
```

Open two side-by-side terminal windows. We need to be quick with the next commands. Minimize your network usage so you can easily spot the UDP frames tshark captures.

In one terminal run:

```bash
sudo tshark -i $ADAPTER -f "udp port 53" -Y dns -V
```

You should see `Capturing on '$ADAPTER_NAME: $ADAPTER'`.

In the other terminal run:

```bash
nslookup facebook.com
```

Back in the first terminal you should see at least two frames. Hit `Ctrl+C` to stop the capture. I'm truncating the output to highlight what matters:

```text
Frame 1: Packet, 72 bytes on wire (576 bits), 72 bytes captured (576 bits) on interface $ADAPTER, id $ADAPTER_ID
... scroll further down:
Domain Name System (query)
    Transaction ID: 0x6c25 # Important: frames with this ID belong to this DNS query/response
...
    Queries
        facebook.com: type A, class IN # our DNS query, still in Frame 1
            Name: facebook.com
            [Name Length: 12] # 12 = facebook (8) + com (3) + invisible terminator 00 (1)

Frame 2: Packet, 88 bytes on wire (704 bits), 88 bytes captured (704 bits) on interface $ADAPTER, id $ADAPTER_ID
...
Domain Name System (response)
    Transaction ID: 0x6c25 # same transaction ID as Frame 1
...
    Answers
        facebook.com: type A, class IN, addr 57.144.120.1
            Name: facebook.com
            Type: A (1) (Host Address)
            Class: IN (0x0001)
            Time to live: 38 (38 seconds)
            Data length: 4
            Address: 57.144.120.1 # our resolved IP, also owned by Facebook
```


Now perform the packet capture again, but route your nslookup through one of the Baidu IPs.

**Questions for you:**
1. Do you see 2 frames, or more?
2. Would you expect more than one response frame?
3. Do all response frames contain the same IP? Who owns each IP?
4. Run tshark capture with `nslookup tencent.net.cn` (not blocked). What's different?
5. If you use a {% dictionaryLink "VPN", "vpn" %} with a Chinese server and perform the same exercise, what differences do you see? Does your {% dictionaryLink "VPN", "vpn" %} use a dedicated DNS server or public infrastructure?

Feel free to reach out if you want to discuss answers or have more questions.

---

# Finally, how does Wallbleed work?

Two more pieces of knowledge before we understand the exploit.

## Heartbleed

Wallbleed is a word play on the catastrophic Heartbleed vulnerability. Heartbleed affected a large portion of web servers and any software relying on OpenSSL: email servers, OpenVPN, you name it.

Never heard of Heartbleed? An {% externalLink "xkcd comic", "https://xkcd.com/1354/" %} explains it brilliantly.

In short: proper bounds checking is not performed (or entirely forgotten), the client provides an input length that doesn't match their payload, and {% dictionaryLink "data exfiltration", "data-exfiltration" %} becomes possible. {% externalLink "MongoBleed", "https://www.akamai.com/blog/security-research/cve-2025-14847-all-you-need-to-know-about-mongobleed" %} is the same type of vulnerability.

Looks like we software engineers don't learn from our past mistakes. Maybe we should write Rust; it comes with memory-safety and runtime bounds checking.

## Wallbleed

Same story. No proper bounds checking, {% dictionaryLink "data exfiltration", "data-exfiltration" %} becomes possible.

But where are these bounds? Let's run tshark again with the `-x` flag to see the hex representation of our DNS query:

```bash
sudo tshark -i $ADAPTER -f "udp port 53" -Y dns -x
```
Run your nslookup command and check the tshark frames; you should see the DNS query with its hex representation this time.

```text
0000  6c 99 61 54 27 07 aa 3f db a2 77 8e 08 00 45 00   l.aT'..?..w...E.
0010  00 3a 82 11 00 00 40 11 85 a2 c0 a8 01 21 6f 3f   .:....@......!o?
0020  41 f7 c4 63 00 35 00 26 23 75 29 83 01 00 00 01   A..c.5.&#u).....
0030  00 00 00 00 00 00 08 66 61 63 65 62 6f 6f 6b 03   .......facebook.
0040  63 6f 6d 00 00 01 00 01                           com.....
```

Lines `0030` and `0040` contain what we're looking for:
- `08` marks the start of the domain name query
- `66 61 63 65 62 6f 6f 6b` is hex-encoded "facebook"
- `03` is the dot separator
- `63 6f 6d` is "com"
- `00` is the special terminator character

The attacker-controlled input is the `.` character: `03`.

The researchers who discovered Wallbleed figured out that by manipulating this value, they could make the DNS injectors "bleed" data, up to 125 bytes per crafted query. This is a classic {% dictionaryLink "buffer over-read", "buffer-over-read" %} vulnerability.

Over a few years they exfiltrated and pieced together more than 5 billion packets. How?
- crafting efficient DNS queries to maximize data exfiltration
- automating queries and running them in batches
- evading detection while silently listening to traffic inside China

---

# Wallbleed impact and timeline

This bug was there for... 14 years. Here's the timeline:

| Date | Event |
|------|-------|
| **2010** | Precursor vulnerability (`gfw-looking-glass.sh`) discovered by klzgrad, leaking 122 bytes |
| **November 2014** | `gfw-looking-glass.sh` patched |
| **October 2021** | Wallbleed measurements begin |
| **2023** | Independently rediscovered by Sakamoto and Wedwards |
| **September-November 2023** | First patch attempt (incomplete)—Wallbleed v2 found within hours |
| **March 2024** | Full patch deployed |
| **February 25, 2025** | Research published at NDSS 2025 |

## Collection methodology

From a single machine at {% externalLink "UMass Amherst", "https://www.umass.edu/" %}, researchers sent 100 packets per second to a Tencent VPS they controlled inside China. Over approximately 2.5 years, they collected **5.1 billion Wallbleed responses** from DNS injectors scattered throughout China's internet infrastructure.

Here's the key insight: you'd expect these DNS injectors to only handle DNS traffic. They don't. They scan *everything*. The researchers found real live internet traffic from users in China—not just DNS queries.

## What the leaked memory revealed

The numbers:
- 184 million SSDP matches
- 174 million UPnP/IGD references
- 2.8 million IPv4 headers with valid checksums
- 7,743 complete TCP segments
- 3,521 "magic sequences" confirming real traffic leakage

The types of data that bled out:
- HTTP headers, cookies, passwords
- SMTP, SSH, TLS commands
- TCP/UDP packet contents
- x86_64 stack frames with {% dictionaryLink "ASLR", "aslr" %}-enabled pointers
- executable code fragments
- RFC 1918 private addresses—revealing GFW's internal network topology

## Traffic that shouldn't exist on the public internet

SSDP and UPnP are protocols for IoT devices: smart TVs, printers, speakers, cameras, washing machines. This traffic is meant to stay on local networks, it shouldn't be on the public internet at all. Yet the GFW infrastructure was collecting it.

When researchers examined IP packet headers in the leaked data, they found something unexpected: a large portion consisted of *private* IP addresses. Only a small fraction was public-to-public traffic. This suggests much of the leaked data was internal GFW management traffic, not just citizen traffic.

## Confirming real traffic leakage

The researchers devised an experiment. They sent 30 UDP packets per second containing a specific string: "GFW bleed." Simultaneously, they continued their regular Wallbleed collection. If their probe traffic appeared in the leaks, it would confirm these injectors capture real live traffic.

It worked. They saw their own probe packets in the leaked data.

This experiment exposed another {% dictionaryLink "side channel", "side-channel" %}: traffic in the injectors' memory only persists for 0-5 seconds before being overwritten. During low-load periods (around 4 AM), they captured more probe traffic. During high-load evenings, less. This revealed the cyclical activity patterns of users in the area.

## What we learned about the GFW's architecture

- **CPU**: x86_64
- **OS**: Linux with {% dictionaryLink "ASLR", "aslr" %} enabled
- At least 3 independent DNS injection processes per device
- Capability to monitor traffic from hundreds of millions of IPs
- 80.3% of vulnerable addresses belong to AS4538 (CERNET)
- The x86_64 stack pointers in leaked data served as a {% dictionaryLink "side channel", "side-channel" %} to infer *when* the GFW was being patched in real time



# Implications

## Targeted surveillance capability

Remember that DNS traffic can be directed to *any* arbitrary IP address inside China. By changing the destination IP, you control which DNS injectors process your traffic. Injectors close to your target IP will respond.

This means Wallbleed enabled **targeted surveillance**. Want to spy on someone in Shanghai? Direct your Wallbleed probes to IP addresses in Shanghai. The leaked memory from nearby injectors has a high probability of containing traffic from your target.

The researchers speculate: "I'm sure some nation-state was using this long before we found it."

## Global reach beyond China's borders

The researchers scanned the entire IPv4 address space with Wallbleed probes. They found that hosts from around the *entire world*—even outside China—triggered injections. Why? Because all it takes is for traffic to be *routed through* China. Source and destination don't matter.

Nearly 7,000 IP addresses outside China were affected. Your data could have been leaked if your traffic happened to transit Chinese infrastructure.

## The cat-and-mouse game

When the GFW first attempted to patch Wallbleed in September 2023, researchers found a bypass, Wallbleed v2, within hours. All they had to do was add back the QTYPE and QCLASS fields that the patch had started to require. The memory leak returned.

It took until March 2024 for a complete fix.

## The Gleg Networks leak: digital authoritarianism as a service

In September 2025, 600GB of internal documents and source code leaked from Gleg Networks, a Chinese cybersecurity company. This company was founded by someone dubbed "the father of the Great {% dictionaryLink "Firewall", "firewall" %} of China." They work closely with MISA Lab (Massive and Effective Stream Analysis), part of the state-run Chinese Academy of Sciences.

This is, to date, the largest internal document and source code leak in the history of the Great {% dictionaryLink "Firewall", "firewall" %}. {% externalLink "Amnesty International", "https://www.amnesty.org/" %}, the {% externalLink "Tor Project", "https://www.torproject.org/" %}, and other organizations analyzed it extensively.

What they found is disturbing: **China's censorship and surveillance software is sold to other countries.**

The confirmed customers include:
- Kazakhstan
- Ethiopia
- Pakistan
- Myanmar
- A mystery customer referred to only as "A24"

In short: Gleg Networks is exporting digital authoritarianism as a managed service. This caliber of censorship and control is no longer reserved for superpowers. Authoritarian governments around the world no longer need to build their own infrastructure; they can buy it from China.


# Sources

**Academic Papers:**
- {% externalLink "Wallbleed: A Memory Disclosure Vulnerability in the Great Firewall of China — GFW Report", "https://gfw.report/publications/ndss25/en/" %}
- {% externalLink "NDSS 2025 Paper (PDF)", "https://www.ndss-symposium.org/wp-content/uploads/2025-237-paper.pdf" %}
- {% externalLink "NDSS Symposium Official Page", "https://www.ndss-symposium.org/ndss-paper/wallbleed-a-memory-disclosure-vulnerability-in-the-great-firewall-of-china/" %}

**Code & Artifacts:**
- {% externalLink "NDSS25 Wallbleed Artifacts Repository", "https://github.com/gfw-report/ndss25-wallbleed" %}
- {% externalLink "Net4People BBS Discussion #456", "https://github.com/net4people/bbs/issues/456" %}

**Technical Journalism:**
- {% externalLink "The Register: Wallbleed bug reveals secrets of China's Great Firewall", "https://www.theregister.com/2025/02/27/wallbleed_vulnerability_great_firewall/" %}
- {% externalLink "Cyber Security News: Wallbleed Exposes Memory Vulnerability", "https://cybersecuritynews.com/wallbleed-exposes-memory-vulnerability/" %}

**Historical Context:**
- {% externalLink "GFW Archaeology: gfw-looking-glass.sh", "https://gfw.report/blog/gfw_looking_glass/en/" %}