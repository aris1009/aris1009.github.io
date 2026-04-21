---
layout: article.njk
title: "Why Your WireGuard Tunnel Breaks on the Same LAN as the Server"
description: "When your phone and your WireGuard server share the same LAN, the tunnel silently fails. The culprit is asymmetric routing, and the fix is hairpin NAT. A walkthrough of the packet path."
date: 2026-04-21
keyword: wireguard, hairpin-nat, nat-reflection, asymmetric-routing, homelab, networking, port-forwarding
tags:
  - networking
  - wireguard
  - nat
  - homelab
difficulty: intermediate
contentType: explanation
technologies: ["WireGuard", "NAT"]
type: article
locale: en-us
permalink: /blog/en-us/wireguard-hairpin-nat-same-lan/
draft: true
---

You run a WireGuard road-warrior server on your home firewall. Your phone's profile points at your public IP (or DDNS name), port `51820`. It works on mobile data. It works from a café. It works from a friend's WiFi. Then one day you join the same WiFi your firewall sits behind, and the tunnel silently dies. TX climbs, RX stays at zero, no handshake.

The profile is fine. The server is fine. The firewall rules are fine. The problem is that the forward path and the return path of your packets no longer match, and WireGuard -- being a stateful UDP protocol -- won't accept a reply that didn't come from the address it sent to.

This post walks through the packet path in both directions, explains why the return trip breaks, and describes what **hairpin NAT** (also called *NAT reflection* or *NAT loopback*) does to fix it.

## The setup

A common homelab topology:

```text
Internet ── ISP router (192.168.1.1)
                      │  public IP: P.P.P.P
                      │
               192.168.1.0/24 LAN
                 │            │
        firewall WAN     phone WiFi
        192.168.1.2      192.168.1.50
        (WireGuard)
```

- The ISP router has a port forward: `P.P.P.P:51820` → `192.168.1.2:51820`.
- The phone's WireGuard profile has `Endpoint = P.P.P.P:51820` (as it should -- one profile, works from anywhere).
- Both devices sit on the same `192.168.1.0/24` LAN behind the ISP router.

From anywhere else on the internet this works. Here it doesn't. To see why, follow a single handshake packet in both directions.

## The forward path works

The phone initiates a handshake. Its kernel builds a UDP packet addressed to the public IP:

```text
phone ─────────────────────────▶ src=192.168.1.50:X  dst=P.P.P.P:51820
```

This packet arrives at the ISP router. The router recognises the destination as its own WAN address and matches the port-forward rule. It applies **destination NAT (DNAT)**: rewrites the destination to the internal target. The source is left alone.

```text
ISP router (DNAT): src=192.168.1.50:X  dst=192.168.1.2:51820
```

The router forwards it onto the LAN. The firewall receives a UDP packet that looks completely normal -- a client on its own WAN subnet trying to speak WireGuard to port `51820`. WireGuard processes the handshake and builds a reply.

So far, so good. Most people stop reasoning here, because this is the half of the path that looks like the port-forward diagram you drew in your head. The problem is in the other direction.

## The return path breaks

The firewall now wants to reply to `192.168.1.50`. It consults its routing table. `192.168.1.0/24` is a **directly connected** network on the firewall's WAN interface -- no gateway needed, the destination is on the same L2 segment.

So the firewall ARPs for `192.168.1.50` and sends the reply **straight to the phone over the LAN**, bypassing the ISP router entirely:

```text
firewall ────────────────────▶ src=192.168.1.2:51820  dst=192.168.1.50:X
```

This is the moment the tunnel dies. Look at what the phone receives:

- It sent a packet to `P.P.P.P:51820`.
- It got a reply from `192.168.1.2:51820`.

WireGuard is stateful. The peer in the profile has a known endpoint, and replies must come from that endpoint for the handshake state machine to accept them. An unsolicited UDP packet arriving from a random LAN address -- even if its contents are a valid WireGuard response -- is not associated with any outstanding handshake. The kernel drops it. The phone retries. The reply arrives from the wrong source again. The handshake never completes.

This pattern has a name: **asymmetric routing**. The request took one path (through the NAT); the reply took another (direct L2). That asymmetry is fatal for any connection-tracked or stateful protocol, including plain TCP -- you'd see the same class of failure if you tried to SSH through the port forward from inside the LAN.

## Why other locations are fine

If the phone is anywhere *not* on `192.168.1.0/24` -- mobile data, a hotel WiFi, a neighbour's network, even a WiFi AP that sits downstream of the firewall on a different subnet -- its source IP is not directly connected to the firewall. So the firewall's reply leaves its default gateway (the ISP router), hits the port-forward state table on the way out, gets **un-NATted** (source rewritten back to `P.P.P.P:51820`), and arrives at the phone looking exactly the way the phone expects.

Same WireGuard profile. Same firewall config. Same ISP router. The only variable is whether the phone shares an L2 segment with the firewall's WAN interface. That one variable is enough to decide between "works" and "silently fails".

## What hairpin NAT does

**Hairpin NAT** (or *NAT reflection*, or *NAT loopback* -- same thing, three names) is a feature of the router doing the port forward. When it detects that traffic is looping back into its own LAN, it applies an extra rewrite on the way in: it **source-NATs** the packet so the original client address disappears behind the router's own LAN address.

With hairpin enabled on the ISP router, the forward path looks like this:

```text
phone → ISP router: src=192.168.1.50:X  dst=P.P.P.P:51820

ISP router rewrites BOTH headers:
  dst → 192.168.1.2:51820   (DNAT, as before)
  src → 192.168.1.1:Y        (extra SNAT -- the hairpin)

firewall receives: src=192.168.1.1:Y  dst=192.168.1.2:51820
```

Now the firewall has no route-table shortcut. The source of the packet is the ISP router itself. The reply goes back to the router, hits the NAT state, gets both headers un-NATted (`192.168.1.1:Y → 192.168.1.50:X` and `192.168.1.2:51820 → P.P.P.P:51820`), and arrives at the phone with exactly the source address the phone expects. Handshake completes.

The trade-off is that the firewall loses visibility of the real client IP for hairpinned connections -- it sees them all as coming from the router. For a WireGuard endpoint on your own LAN, that's fine. For other services (a self-hosted website you also access from inside), it's worth knowing.

## Why this is the ISP router's job, not the firewall's

A reasonable instinct is to try to fix this on the firewall -- after all, it's the device you actually control. But there is nothing the firewall can do. The problem is that the firewall's reply never reaches the router in the first place. The firewall doesn't get a chance to do anything because, from its perspective, everything is working correctly: it got a packet from a local client, it sent a reply to that local client, end of story. The thing that needs to change is the *request* arriving with a source address the firewall can't short-circuit to. Only the router that owns the public IP can rewrite it.

That's why the fix lives in the ISP router's feature set. Most consumer routers either:

- support it and call it **NAT Loopback** or **NAT Reflection** (usually off by default), or
- don't support it at all -- in which case your options narrow to putting the ISP router in bridge mode so your firewall gets the public IP directly, running an overlay network (Tailscale, Netbird) that finesses NAT via relays, or making sure your phone is never on the same LAN as the firewall's WAN.

## The general shape of the lesson

Port forwarding looks like a one-way arrow on a diagram, but NAT is stateful, and state only works if packets traverse the NAT device in both directions. Any time you find yourself looking at a port-forward that works from outside and breaks from inside, the question to ask is not "is the forward rule correct" but "what path does the reply take, and does it go through the same NAT engine as the request". Nine times out of ten, the answer is no, and the reason is that the client and the server are on the same subnet as each other -- close enough for a direct shortcut that skips the NAT entirely.

Hairpin NAT is the specific remedy. Symmetric routing is the general principle. WireGuard is just the protocol that happens to be strict enough to make the failure loud.
