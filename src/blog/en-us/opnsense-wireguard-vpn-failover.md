---
layout: article.njk
title: "OPNsense WireGuard VPN Gateway Failover with IVPN"
description: "Set up tiered gateway failover for WireGuard VPN tunnels on OPNsense, so if your primary exit server goes down, traffic automatically fails over to the next."
date: 2026-04-10
keyword: opnsense, wireguard, vpn, failover, gateway group, ivpn, firewall, homelab, policy routing
tags:
  - networking
  - opnsense
  - wireguard
  - vpn
  - homelab
difficulty: intermediate
contentType: tutorial
technologies: ["OPNsense", "WireGuard", "IVPN"]
type: article
locale: en-us
permalink: /blog/en-us/opnsense-wireguard-vpn-failover/
---

In this tutorial, we will set up tiered WireGuard {% dictionaryLink "VPN", "vpn" %} gateway failover on OPNsense. We start with a single WireGuard tunnel to a {% dictionaryLink "VPN", "vpn" %} provider, add two more tunnels to servers in different locations, and wire them into a gateway group so traffic automatically fails over when a server goes down.

Along the way, we will work with WireGuard peers and instances, interface assignments, gateways, gateway groups, outbound NAT, and policy routing -- the core building blocks of multi-WAN on OPNsense.

## What We Are Building

We have OPNsense acting as a WireGuard road warrior {% dictionaryLink "VPN", "vpn" %} server. Mobile clients connect to OPNsense over WireGuard, and a second WireGuard instance on OPNsense forwards their internet traffic through a commercial {% dictionaryLink "VPN", "vpn" %} provider (IVPN in our case). This is sometimes called {% dictionaryLink "VPN", "vpn" %} chaining.

The problem: if the single {% dictionaryLink "VPN", "vpn" %} exit server goes down, our mobile clients lose internet access entirely. We will fix this by adding two fallback servers and creating a gateway group with three priority tiers:

```text
Phone ──WireGuard──▶ OPNsense ──▶ Tier 1: New York (primary)
                                  ──▶ Tier 2: Los Angeles (failover)
                                  ──▶ Tier 3: Miami (failover)
```

## Prerequisites

Before we begin, you need:

- OPNsense 24.7 or later (we are using 26.1)
- One working WireGuard client tunnel to your {% dictionaryLink "VPN", "vpn" %} provider (this is our Tier 1)
- A policy route that sends specific clients through that tunnel
- An active account with your {% dictionaryLink "VPN", "vpn" %} provider and access to at least two additional server endpoints
- WireGuard credentials (private key, tunnel address) from your provider

We will refer to the existing tunnel as `wg1` throughout. If yours has a different name, substitute accordingly.

## Step 1: Gather Your Server Details

First, we need the connection details for our two fallback servers. We want to pick servers with low load in geographically close locations.

IVPN publishes their server list at `https://api.ivpn.net/v5/servers.json`. Open that URL and find two WireGuard servers in your preferred locations. For each server, note down:

- **Hostname** (e.g., `us-ca6.wg.ivpn.net`)
- **Public key**
- **Port** (typically `51820`)

We also need to confirm the details of our existing tunnel. Open **{% dictionaryLink "VPN", "vpn" %} > WireGuard > Instances** and click the pencil icon on your existing instance. Note down:

- **Private key** (we will reuse this for all tunnels -- your provider associates it with your account)
- **Tunnel address** (your assigned IP, e.g., `172.16.5.100/32`)
- **Gateway IP** (the arbitrary IP used for routing, e.g., `172.26.0.1`)
- Whether **Disable Routes** is checked (it should be, if you are policy-routing)

We will use these values in the next steps. Close the dialog without changing anything.

## Step 2: Add WireGuard Peers

Go to **{% dictionaryLink "VPN", "vpn" %} > WireGuard > Peers** and click the **+** button.

Fill in the fields for our first fallback server:

| Field | Value |
|---|---|
| Enabled | Checked |
| Name | `IVPN_LA` |
| Public Key | *(the public key from Step 1)* |
| Allowed IPs | `0.0.0.0/0` |
| Endpoint Address | `us-ca6.wg.ivpn.net` |
| Endpoint Port | `51820` |
| Keepalive | `25` |

Click **Save**.

Now click **+** again and add the second fallback:

| Field | Value |
|---|---|
| Enabled | Checked |
| Name | `IVPN_Miami` |
| Public Key | *(the public key from Step 1)* |
| Allowed IPs | `0.0.0.0/0` |
| Endpoint Address | `us-fl2.wg.ivpn.net` |
| Endpoint Port | `51820` |
| Keepalive | `25` |

Click **Save**, then click **Save** again at the bottom of the page.

Notice that we use hostnames rather than IPs for the endpoint address. {% dictionaryLink "VPN", "vpn" %} providers occasionally change server IPs, but hostnames stay stable.

## Step 3: Create WireGuard Instances

Go to **{% dictionaryLink "VPN", "vpn" %} > WireGuard > Instances** and enable **Advanced Mode** (toggle in the top-right corner).

Click **+** to add a new instance for our Los Angeles fallback:

| Field | Value |
|---|---|
| Enabled | Checked |
| Name | `IVPN_LA` |
| Private Key | *(same private key as your existing instance)* |
| Listen Port | `5565` |
| Tunnel Address | *(same tunnel address as your existing instance)* |
| Peers | `IVPN_LA` |
| Disable Routes | **Checked** |
| Gateway | `172.26.0.9` |

Click **Save**.

Click **+** again for the Miami fallback:

| Field | Value |
|---|---|
| Enabled | Checked |
| Name | `IVPN_Miami` |
| Private Key | *(same private key as your existing instance)* |
| Listen Port | `5566` |
| Tunnel Address | *(same tunnel address as your existing instance)* |
| Peers | `IVPN_Miami` |
| Disable Routes | **Checked** |
| Gateway | `172.26.0.17` |

Click **Save**, then **Save** again at the bottom.

A few things to notice here:

- Each instance must have a **unique listen port**. Our existing tunnel uses its own port, so we pick two new ones that don't collide.
- We reuse the **same private key and tunnel address** across all instances. The {% dictionaryLink "VPN", "vpn" %} provider identifies us by our key, not by which server we connect to.
- The **Gateway** field is an arbitrary IP that OPNsense uses internally for routing. It does not need to match anything on the {% dictionaryLink "VPN", "vpn" %} provider's side -- it just needs to be unique per instance.
- **Disable Routes** is critical. Without it, WireGuard would add a default route that bypasses our policy routing entirely.

Now restart WireGuard to bring up the new tunnels. Go to **{% dictionaryLink "VPN", "vpn" %} > WireGuard > General** and toggle the service off, then on again.

## Step 4: Assign Interfaces

Go to **Interfaces > Assignments**. In the dropdown at the bottom, you should see the new WireGuard devices (`wg2`, `wg3`). Select each one, give it a description, and click **+** to add it.

We name them `IVPN_LA` and `IVPN_Miami` to match our instances.

Now click on each new interface in the left sidebar to configure it:

| Field | Value |
|---|---|
| Enable | Checked |
| IPv4 Configuration Type | **None** |
| IPv6 Configuration Type | **None** |

Click **Save**, then **Apply changes**. Repeat for the second interface.

After applying, both interfaces should show as UP in **Interfaces > Overview**. The WireGuard tunnel handles the actual addressing -- we set the interface to "None" because OPNsense only needs it as a routing target.

## Step 5: Create Gateways

Go to **System > Gateways > Configuration** and click **Add**.

Create a gateway for the Los Angeles tunnel:

| Field | Value |
|---|---|
| Name | `IVPN_LA_GW` |
| Interface | `IVPN_LA` |
| Address Family | IPv4 |
| IP address | `172.26.0.9` |
| Far Gateway | **Checked** |
| Monitor IP | *(see note below)* |

Click **Save**.

Add another for the Miami tunnel:

| Field | Value |
|---|---|
| Name | `IVPN_Miami_GW` |
| Interface | `IVPN_Miami` |
| Address Family | IPv4 |
| IP address | `172.26.0.17` |
| Far Gateway | **Checked** |
| Monitor IP | *(see note below)* |

Click **Save**, then **Apply changes**.

The **IP address** must match the Gateway value we set in the WireGuard instance (Step 3). **Far Gateway** must be checked because the gateway IP is not on the same subnet as the interface -- it is a virtual construct for routing.

**About Monitor IP:** OPNsense pings this IP through the tunnel to determine if the gateway is alive. Good choices:

- The {% dictionaryLink "VPN", "vpn" %} server's endpoint IP -- if the server is down, the monitor fails, which is exactly what we want.
- A well-known IP like `9.9.9.9` or `208.67.222.222` -- works, but creates a host route through the tunnel that could interfere if those IPs are used elsewhere on your network.

The monitor IP field only accepts IP addresses, not hostnames. Resolve your server hostname if needed: `dig +short us-ca6.wg.ivpn.net`.

## Step 6: Create the Gateway Group

Go to **System > Gateways > Group** and click **+ Add**.

| Field | Value |
|---|---|
| Group Name | `IVPN_Failover` |

Now assign tiers to each gateway:

| Gateway | Tier |
|---|---|
| *(your existing NY gateway)* | **Tier 1** |
| `IVPN_LA_GW` | **Tier 2** |
| `IVPN_Miami_GW` | **Tier 3** |

Set the **Trigger Level** to **Packet Loss or High Latency**.

Click **Save**.

The tier system works like this: OPNsense uses Tier 1 exclusively as long as it is healthy. When Tier 1 goes down (detected by the gateway monitor), OPNsense regenerates its {% dictionaryLink "firewall", "firewall" %} rules to route through Tier 2. If Tier 2 also fails, it falls to Tier 3. When a higher-priority tier recovers, traffic shifts back automatically.

## Step 7: Add Outbound NAT Rules

Go to **{% dictionaryLink "Firewall", "firewall" %} > NAT > Outbound**.

If the mode is set to "Automatic", switch it to **Hybrid outbound NAT rule generation** and click **Save**, then **Apply changes**.

Now click **Add** to create a rule for each new tunnel. We need NAT so that traffic leaving through the tunnel appears to come from the tunnel's interface address.

For the Los Angeles tunnel:

| Field | Value |
|---|---|
| Interface | `IVPN_LA` |
| TCP/IP Version | IPv4 |
| Protocol | any |
| Source address | *(your {% dictionaryLink "VPN", "vpn" %} clients alias)* |
| Destination address | any |
| Translation / target | **Interface address** |

Click **Save**. Repeat with `IVPN_Miami` as the interface.

Click **Apply changes**.

You should already have an equivalent rule for your existing `wg1` interface. The new rules follow the same pattern -- one per tunnel, each NATing client traffic to the tunnel's own address.

## Step 8: Update the Policy Route

This is the final step. Go to **{% dictionaryLink "Firewall", "firewall" %} > Rules** and find the interface where your existing VPN policy route lives (for us, this is under **WireGuard**).

Find the rule that matches your {% dictionaryLink "VPN", "vpn" %} clients alias with an inverted destination of RFC1918 (private addresses). Click the pencil icon to edit it.

Scroll down to the **Gateway** dropdown. Change it from the single gateway to **IVPN_Failover** (the gateway group we created in Step 6).

Click **Save**, then **Apply changes**.

The policy route now points at the gateway group instead of a single gateway. When all three gateways are healthy, traffic flows through Tier 1 as before. The difference is that now there is a safety net.

## Verifying the Setup

Let's confirm everything is wired up correctly.

**Check the tunnels are alive.** SSH into OPNsense and run:

```bash
sudo wg show
```

You should see three interfaces (`wg1`, `wg2`, `wg3`), each with a recent handshake (within the last few minutes) and transfer counters ticking up.

**Check the gateways are online.** Go to **System > Gateways > Status**. All three gateways should show a green status with round-trip times.

**Check the policy route.** Run:

```bash
sudo pfctl -sr | grep route-to
```

You should see your rule with `route-to` pointing at the Tier 1 gateway. This is correct -- OPNsense only loads the active tier into the {% dictionaryLink "firewall", "firewall" %} rules. When Tier 1 fails, this rule is automatically regenerated to point at Tier 2.

**Check the NAT rules.** Run:

```bash
sudo pfctl -sn | grep wg
```

You should see NAT entries for all three WireGuard interfaces.

## What We Built

We started with a single WireGuard VPN tunnel that was a single point of failure. We now have three tunnels across three locations, managed by a gateway group that handles failover automatically. The `dpinger` daemon on OPNsense continuously monitors each gateway and rewrites the {% dictionaryLink "firewall", "firewall" %} rules when one goes down.

Clients connect to OPNsense the same way they always did -- nothing changes on the client side. The failover is entirely server-side and transparent.
