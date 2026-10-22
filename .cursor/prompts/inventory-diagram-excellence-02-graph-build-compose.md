# IDX-02 — Graph-build hop compose and role dedupe

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-01 preferred (fixtures may land first). **Do not** implement cited-hop demotion, verbs, nested frames, PE UI, or IDX-03–13.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Compose hidden NIC / private-endpoint / parent-child hops on the **snapshot visible projection** (graph-build), then dedupe by `(fromNodeId, toNodeId, role)` **before** `DiagramAstFromGraphCompiler` mode filters. Every `DiagramMode` consumes the same composed edges. NIC and PE **cards** stay off unless `IncludePrivateEndpointNodes` is true (PE only).

## Why

`DiagramCollapsedAttachmentEdgeLifter` runs after node filters. DataFlow and DataArchitecture skip it. Full subscription hides NIC/PE then drops the hops. Duplicate `CONNECTS_TO` plus collocation `likely · in` steal the same from|to key so lift is skipped. A shared projection is the only way Identity, Data, neighborhood, and Full subscription stay honest together.

## Applies to every `DiagramMode`

| Mode | Compose behavior |
|------|------------------|
| Executive / Architecture / FullSubscription / Network / Security | Collapse NIC onto owner; compose PE→target + PE→subnet as target `in` subnet/VNet when PE card hidden |
| Identity | Compose `USES_IDENTITY` / `FEDERATES_AS` onto remaining identity nodes; skip VNet compose when no network nodes |
| Data / DataArchitecture | Compose PE hops onto storage/data accounts still on the canvas |
| DataFlow | **Must no longer skip** attachment compose; keep stage subgraphs |
| ResourceGroup | Compose only among nodes in that RG plus required ancestors (VNet parent of a subnet in the RG) |
| SelectedResources / DependencyNeighborhood | Compose among included nodes; include a hidden hop's **visible** endpoints even if the NIC/PE card stays out |

## Context

- `AzureInventoryVisibleSnapshotProjection`
- `AzureInventoryArmEndpointNodeResolver` / `ArmResourceIdNormalizer.EnumerateAncestorResourceIds`
- `DiagramCollapsedAttachmentEdgeLifter`, `DiagramArmParentChildEdgeHydrator`, `DiagramAstFromGraphCompiler`
- `AzureInventoryNeverShowArmTypes` (NIC, PE)

## What to build

1. New (own file) snapshot-graph composer used by `AzureInventorySnapshotGraphResolver` (or the existing visible projection) that:
   - Rewrites NIC endpoints onto the NIC owner (VM, private endpoint, App Gateway, etc.).
   - When PE nodes are not in the **display** set, composes PE→target and PE→subnet/VNet onto the target (skip compose when PE **is** on the canvas so you do not double-draw).
   - Lifts nested subnet ARM ids onto the parent VNet node when the subnet is not its own canvas node.
   - Emits `CONTAINS` for ARM parent/child when both visible endpoints exist (ancestor mapping allowed).

2. Dedupe key `(from, to, role)` where `role` is `GraphEdgeTypes` (or association type), not the human label. Keep the higher-provenance edge (ObservedFact > HumanAssertion > DeterministicInference). Do not let collocation steal a cited `in`.

3. `DiagramAstFromGraphCompiler` reads composed edges for **all** modes, including DataFlow / DataArchitecture. Remove the “skip lifter on SecureNow data modes” behavior for hop compose (stage filters still apply to **which movement edges** DataFlow shows).

4. Tests:
   - VM→NIC→subnet, PE hidden → VM `in` VNet/subnet on **each** of the twelve modes that still include the VM; Identity/DataFlow fixtures without the VM assert no invented VM edge.
   - PE on canvas (`IncludePrivateEndpointNodes = true`) → no duplicate target `in` subnet plus PE hops; PE card present.
   - Duplicate CONNECTS_TO + likely-in same endpoints → one edge, cited role wins.
   - DataFlow compile no longer drops VM/app subnet placement when the app is a stage node.

## Acceptance criteria

- Default compile: zero NIC nodes, zero PE nodes, nonzero composed placement edges when hops exist.
- No Azure HTTP at compile time.

## Constraints

- **Do not** implement IDX-03 all-to-all demotion here beyond dedupe.
- **Do not** show NIC cards.
- Verification: Application visible-projection tests + ArtifactSynthesis compiler/lifter tests. Compile filter must include DataFlow and FullSubscription.

## Done when

One snapshot graph fixture compiles to placement edges in FullSubscription, Network, Executive, DataFlow, and DependencyNeighborhood without PE/NIC cards.
