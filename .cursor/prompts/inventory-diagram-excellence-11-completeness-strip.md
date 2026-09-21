# IDX-11 — Mode-aware completeness strip

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-01. **Do not** call Azure at render time.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Replace the generic completeness banner with a **mode-aware strip** that explains (1) walkthrough counts `{n} resources in {c} connected components. {e} visible relationships.` including hops used in analysis but not shown as cards, and (2) which relationship **classes** were collected vs missing for the **current** `DiagramMode`.

## Why

Owner Full subscription showed `247 resources / 232 components / 15 relationships` with no explanation that NIC→subnet was uncollected, PEs were hidden, or collocation was last-resort. IE-RF-09 codes exist but the banner is a flat list. Network vs Identity vs DataFlow care about different classes.

## Applies to every `DiagramMode`

| Mode | Classes the strip must mention when relevant |
|------|----------------------------------------------|
| Network / FullSubscription / Executive / Architecture | vmToNic, nicToSubnet, peToSubnet, peToTarget, vnetPeering, nested ARM CONTAINS |
| Security | diagnostics, NSG applies, (not Full-sub RBAC) |
| Identity | federated credentials, group memberships, USES_IDENTITY |
| Data / DataArchitecture | diagnostics, PE targets, ADF linked services |
| DataFlow | ADF linked services, Logic App connections, app-setting hosts (Tier 1 flag) |
| ResourceGroup | same classes scoped to that RG |
| SelectedResources / DependencyNeighborhood | classes among included nodes; say when the seed has hidden PE hops |

Reuse `InfraEvidenceCompletenessWarningsBanner` (or extend it). No new nav item. No “graph too large” for sparse topology (**IE-ND-05** honesty).

## Context

- `InfraEvidenceCompletenessWarningsBanner.tsx`
- Snapshot `completenessWarnings` on preview/render
- Walkthrough / DAU caption lines
- IE-RF-09 codes

## What to build

1. Server: attach a structured completeness payload per render (own contract type): `mode`, `visibleNodeCount`, `visibleEdgeCount`, `connectedComponentCount`, `hiddenHopsUsedCount` (NIC/PE composed), `missingClasses[]`, `collectedClasses[]`. Keep string warnings for back-compat.

2. Strip copy (sentence case): e.g. `247 resources in 40 groups. 88 visible relationships (12 from hidden private-endpoint hops). Missing: NIC subnet ids.` Do not claim “complete” if any required class for that mode is missing.

3. Last-resort collocation count (from IDX-03) appears as `N likely-in collocation edges` so humans do not treat them as peering.

4. Tests:
   - VM fixture without nicToSubnet → Network and FullSubscription strips include that missing class; Identity strip does **not** scare about nicToSubnet unless VMs are on the identity canvas (they are not).
   - PE hidden + composed hops > 0 → `hiddenHopsUsedCount` > 0 on FullSubscription and Data.
   - Vitest: banner testid remains or is extended; DataFlow vs Network render different missing-class text from the payload.
   - Neighborhood: strip does not use Full subscription node counts.

## Acceptance criteria

- No Azure backfill. Ingest remains fail-soft.
- Desktop tabs unchanged.

## Constraints

- If the wire contract grows, update OpenAPI snapshot.
- Do not start IDX-12 hop-focus compile here.

## Done when

Switching Full subscription → Network → Identity → Data Flow changes the strip’s missing-class list, and the walkthrough no longer implies 15 edges are all Azure had.
