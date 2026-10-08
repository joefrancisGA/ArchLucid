> **Scope:** Chapter 5 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 5 — Network reachability

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

Configuration tells you **intended** reachability. Proving actual reachability needs observation. Keep the two separate.

## Key points

- Public network access flags, private endpoints, service endpoints.
- NSGs, Azure Firewall, route tables, VNet peering and hub-spoke topologies.
- Common gap: private endpoint added but public access never disabled.
- Intended versus configured versus observed versus human-confirmed.

## Lab idea

Resource Graph queries that list PaaS resources with both a private endpoint and public network access enabled.

## Open questions

- Include Network Watcher / flow logs as the "observed" layer, or keep it brief?
