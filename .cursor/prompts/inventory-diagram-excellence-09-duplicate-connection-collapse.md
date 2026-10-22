# IDX-09 — Duplicate connection collapse

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-03. **Do not** all-to-all the collapsed card.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Collapse duplicate `Microsoft.Web/connections` (same API type + same resource group, or identical ARM id) into one card with a count, keeping **cited** Logic App / workflow hops from IDX-03.

## Why

Standard Logic Apps share Office365 / Teams / Excel connectors as sibling resources. After maximize-edges, the RG fills with near-identical connection cards. Humans need one “Office 365 (3)” and the workflows that cite it.

## Applies to every `DiagramMode`

| Mode | Collapse? |
|------|-----------|
| FullSubscription / Executive / Architecture / ResourceGroup | **Yes** when connection nodes survived the filter |
| DataFlow / DataArchitecture | **Yes** — connection cards often appear as sources/sinks |
| SelectedResources / DependencyNeighborhood | **Yes** among included connection nodes only |
| Network / Security / Identity / Data | **Skip** when connections are filtered out; assert zero connection nodes rather than collapsing unrelated NICs/KVs |

## Context

- `AzureInventoryLogicAppConnectionExtractor`
- `AzureInventorySnapshotLogicAppConnectionHydrator`
- Overflow/rollup node pattern (`DiagramExecutiveAlwaysShowSelector.IsOverflowNode`) — reuse for connections; neighborhood seed must remain null on rollups (existing rule)

## What to build

1. Collapse key: ARM type `Microsoft.Web/connections` + API name (`properties.api.name` or display) + RG. If API name missing, fall back to ARM id (no collapse).

2. Surviving node label `Office 365 (3)` (API display + count). Edges from workflows that cited **any** merged connection retarget the survivor. Provenance stays cited.

3. Do not draw workflow → every other remaining connection of that API in other RGs.

4. Tests:
   - Three office365 connections same RG, one Logic App citing two → one card count 3 or 2 (lock: count **merged nodes**, not citations); Logic App has cited edges to the survivor only.
   - Two connections different APIs → no merge.
   - Identity fixture → no connection collapse code path throw.
   - Member data: all twelve modes compile.

## Acceptance criteria

- Rollup nodes are not neighborhood seeds (existing overflow rule).
- No complete-graph to every app in the RG.

## Constraints

- **Do not** collapse unrelated `Microsoft.Web/sites`.
- Secret values in connection parameter fields stay out of labels.

## Done when

Full subscription and Data Flow show one card per API+RG rather than N duplicate Office365 nodes, with cited workflow hops preserved.
