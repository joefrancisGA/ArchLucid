> **Scope:** Chapter 3 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 3 — Collecting Azure evidence read-only

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

You can build a strong evidence base with **Reader** on Azure and narrowly scoped Microsoft Graph permissions. Scopes you cannot read become documented gaps, not silent blind spots.

## Key points

- Azure Resource Graph (KQL) for inventory at scale.
- Role assignments and role definitions across management groups, subscriptions, resource groups.
- Microsoft Graph for users, groups, service principals, app registrations, federated credentials.
- Snapshots: hash and timestamp each collection so later comparisons are trustworthy.
- Never collect secret values; record that a setting exists, not what it contains.

## Lab idea

PowerShell / Azure CLI script that exports a snapshot to JSON with a manifest of what was readable and what was denied.

## Open questions

- Minimum Graph application permissions list to recommend (verify against current Microsoft docs at writing time).
