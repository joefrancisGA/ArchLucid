# IDX-05 — Nested VNet and subnet frames

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-04 preferred. **This prompt authorizes nested Azure boxes.** Do **not** implement them from IDA / IDF sessions. **Do not** implement subscription outer (IDX-06).

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

When a mode's **visible** nodes include a virtual network and either subnet nodes or resources composed `in` those subnets, inventory-forest draws nested frames **resource group → VNet → subnet** (subnet layer omitted when subnet is not a node and multiple subnets would otherwise be indistinguishable). Graphviz PNG emits matching nested `cluster_`. Export Mermaid may keep existing IE-ND-04 subgraphs but must not contradict forest membership.

## Why

IDA-HOLD / IDF-HOLD blocked nested frames as a second layout engine. Network mode still looks like a flat RG of NICs-collapsed VMs. Humans expect Visio-style VNet boxes. The packer must be **shared** so Identity/Data skip empty nests instead of forking a Network-only hack.

## Applies to every `DiagramMode`

| Mode | Nest |
|------|------|
| Network | Hero: always nest VNets that have members; draw subnet frames when subnet nodes or distinct composed `in` groups exist |
| Executive / Architecture / FullSubscription / Security | Nest remaining VNets; Executive peel may leave VNet-only — still draw the VNet frame around remaining attached VMs |
| Data / DataArchitecture | Nest a VNet only if a data/storage node is composed `in` it |
| Identity | Usually skip (no network nodes); assert **zero** VNet frames rather than empty boxes |
| DataFlow | Do **not** replace stage subgraphs. If a stage node is ARM-located in a VNet, a light nested label/frame **inside the stage** is allowed; do not RG-first-pack the whole DataFlow canvas |
| ResourceGroup | Nest VNets **inside that RG only** |
| SelectedResources / DependencyNeighborhood | Nest only VNets/subnets that appear in the hop-focus set; do not pull the rest of the VNet's subscription |

## Context

- `DiagramResourceGroupPacker`, `DiagramForestResourceGroupFrameSvgEmitter`, `DiagramForestLayoutSvgRenderer`
- `DiagramResourceGroupGraphvizClusterPlanner`
- IE-ND-04 subnet subgraph planner (extend, do not re-open IE-ND as greenfield)
- IDF frame ink: 2 px solid `#64748b` RG; nested VNet/subnet must use a **distinct** lighter stroke (not peering `6 4`, not declared `4 3`, not RG 2 px `#64748b` clone). Suggest 1.5 px solid `#94a3b8` for VNet and 1 px solid `#cbd5e1` for subnet — lock in tests.

## What to build

1. Nested cell model (own files): a framed cell may contain child frames. Pack inside-out (subnet → VNet → RG) without overlapping AABBs (0.5 px).

2. Skip rules: no VNet frame when the VNet node is absent **and** no composed members; no empty nest; no NIC frames.

3. Labels inside, matching IDF-02 inside-label pattern (smaller type for subnet).

4. Tests:
   - Network fixture: one VNet, two subnets, VMs composed `in` → one VNet frame, two subnet frames, no overlap; PNG has nested clusters.
   - Identity fixture with only identity nodes → 0 VNet frames.
   - DataFlow fixture with stage subgraphs → stage ids still present; no wholesale RG-first replacement.
   - FullSubscription / Executive / ResourceGroup / neighborhood member data: nest when members exist, skip otherwise.
   - AABB non-overlap like IDF-01.

## Acceptance criteria

- Nested frames never draw from an IDA/IDF chat leftover. Distinct stroke from RG frames and from peering dashes.
- Singleton subnet with all members already in the VNet may omit the subnet layer (document in test).

## Constraints

- **Do not** bump global component gaps. **Do not** default Graphviz `dot`.
- **Do not** merge disconnected components to share a VNet box if they are not actually in that VNet.

## Done when

Network forest shows VNet→subnet chrome, Identity does not, and Full subscription nests only VNets that have surviving members.
