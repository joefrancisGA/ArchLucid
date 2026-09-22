# IDX-07 — Role-aware packing and hubs

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-05. **Do not** implement singleton-RG collapse or Mermaid gap retune.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Inside each resource-group frame (and inside nested VNet frames when present), pack visible nodes into **role columns** (compute, data/storage, identity, network, integration/other) and place high-degree nodes as **hubs** (VNet, Key Vault, NSG, ADF, App Gateway) rather than stacked peers. Shared packer; each mode only packs nodes it kept.

## Why

RG-first Visio packing still uses a role-blind flow grid. A Key Vault with twenty `in`/`uses` edges sits in a column between disks and runbooks. IDA-07 hub-and-spoke existed for a different layout era; reuse the idea inside frames.

## Applies to every `DiagramMode`

| Mode | Packing |
|------|---------|
| FullSubscription / Executive / Architecture / ResourceGroup | Role columns inside each RG; hubs at the VNet or RG center |
| Network | Inside VNet frames: subnets as columns or nested frames (IDX-05 wins); gateways/firewalls as hubs |
| Security | NSG / Key Vault / Firewall hubs; do not mix with unrelated compute if those nodes survived |
| Identity | Single identity column is fine; hub App registrations / Key Vault if degree high |
| Data / DataArchitecture | Data vs storage columns; ADF hub when present |
| DataFlow | **Keep LR stages.** Inside a stage, hub a shared ADF/KV; do not restage into RG columns |
| SelectedResources / DependencyNeighborhood | Role-pack only the hop-focus nodes; do not add siblings to fill a column |

## Context

- `DiagramResourceGroupCellFlowPlanner.GroupByLayers`
- IDA-07 hub-spoke placement (`inventory-diagram-aesthetics-07-hub-spoke-placement.md`) — reuse, do not re-run IDA
- `GraphTopologyCategories`

## What to build

1. Role classifier (own file) from ARM type / category: compute, data, storage, identity, network, integration. Unknown → integration/other.

2. Cell flow: columns by role (stable order locked in tests). Empty roles omitted.

3. Hub placement: if a node’s visible degree ≥ 3 (or it is a VNet/KV/NSG/ADF/App Gateway), pin as hub with spokes using existing orthogonal router. Do not cross RG frames.

4. Tests:
   - RG with VM, SQL, KV, NIC-collapsed VM already `in` VNet → compute | data | identity columns, KV or VNet hub.
   - DataFlow stage with three sinks + one ADF → ADF hub, stages still LR.
   - Neighborhood two nodes → no extra column fillers.
   - Member data: all twelve modes compile without throw on the same fixture.

## Acceptance criteria

- Orthogonal edges still avoid cards (IDA-05). No global gap bump.

## Constraints

- **Do not** restore `alpack_*`. **Do not** retune Mermaid spacing.

## Done when

A mixed RG forest is scannable by role in Full subscription and ResourceGroup, and DataFlow still reads left-to-right by stage.
