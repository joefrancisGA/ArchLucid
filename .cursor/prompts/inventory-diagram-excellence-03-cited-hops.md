# IDX-03 — Cited hops instead of all-to-all

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-02. **Do not** implement verbs, nested frames, PE UI, or a complete graph.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Emit an edge only when a **cited hop** exists (association row, ARM id in properties, Logic App connection, diagnostic destination, peering, composed NIC/PE path, ARM parent/child). Same-RG collocation and “only VNet in this group” fan-out become **last-resort** `DeterministicInference` (`likely · in`) and must **not** fire when any cited hop already places that node. **Never** add a cross-resource-group edge without a cited hop.

## Why

Maximize-edges hydrators made the canvas look connected by drawing Logic App ↔ every `Microsoft.Web/connections` in the RG and every VM ↔ the only VNet. That is a complete subgraph, not architecture. Humans cannot tell which connection the workflow uses. Cross-RG guesses are worse.

## Applies to every `DiagramMode`

| Mode | Rule |
|------|------|
| FullSubscription / Executive / Architecture / ResourceGroup | Demote same-RG collocation; keep cited Logic App, ADF, property ARM-id, diagnostic, NSG applies |
| Network | Cited nic/PE/subnet/peering only; no “every NIC in the VNet” clique |
| Security | Cited NSG/diagnostic/protects; no all-to-all among Key Vaults |
| Identity | Cited `USES_IDENTITY` / `MEMBER_OF` / `FEDERATES_AS` only |
| Data / DataArchitecture | Cited PE/diagnostic/ADF; no every-database-in-RG mesh |
| DataFlow | Cited linked service / connection / app-setting host; stage adjacency is not a substitute for a mesh |
| SelectedResources / DependencyNeighborhood | Cited hops among included nodes only; do not collocation-fill the neighborhood |

## Context

- `AzureInventorySnapshotSameResourceGroupEdgeHydrator`
- `AzureInventorySnapshotLogicAppConnectionHydrator`
- `AzureInventorySnapshotPropertyArmIdEdgeHydrator`
- `GraphEdgeInferenceSources.InventoryResourceGroupCollocation`

## What to build

1. Introduce a small cited-hop predicate (own file): true when the edge has association type / ARM id / composed attachment / peering / diagnostic / Logic App connection id. Collocation is not cited.

2. Same-RG hydrator: if a node already has a cited placement (`in` / `contains` / composed subnet), **do not** also emit collocation to every other same-RG node or to “the only VNet.”

3. Logic App hydrator: edge only to connections **named in** `$connections` / workflow JSON, not every `Microsoft.Web/connections` in the RG.

4. Cross-RG: delete or never add collocation across groups. Property ARM-id and peering remain valid cross-RG cited hops.

5. Tests for **each** mode (theory / member data over `DiagramMode`):
   - Logic App + 3 connections in RG, only 2 cited → 2 edges, not 3, on FullSubscription, DataFlow, ResourceGroup.
   - Two VMs same RG, one VNet other RG, cited NIC hops to that VNet → VM→VNet cited; **no** VM↔VM collocation.
   - Two Key Vaults same RG, no hops → zero or last-resort `likely · in` to RG container only, never KV↔KV.
   - Neighborhood seed with one cited dependency → no collocation to unrelated same-RG nodes outside depth.

## Acceptance criteria

- No complete-graph helper. No “maximize edges no matter what” clique.
- Last-resort collocation, if kept, is dotted `likely · in` (IDP inferred language) and documented in completeness (IDX-11 will surface it).

## Constraints

- **Do not** dump RBAC `MAY_ACCESS` onto Full subscription to replace collocation.
- Verification: Application MaximizeEdges / LogicApp / SameResourceGroup tests + compiler theory over all twelve modes.

## Done when

A same-RG Logic App fixture is a star to cited connections, not a clique, in Full subscription **and** Data Flow.
