# IDX-06 — Subscription outer frame

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-05. **Do not** implement singleton collapse (IDX-08).

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Subscription-scoped inventory canvases draw **one outer subscription frame** around resource-group frames (and their nested VNet/subnet frames). Crop includes the outer frame. PNG has a matching outer cluster.

## Why

Azure's model is subscription → resource groups → resources. Visio RG packing stopped at RG. Humans comparing Executive, Network, and Full subscription still get a floating sheet of boxes.

## Applies to every `DiagramMode`

| Mode | Outer subscription frame? |
|------|---------------------------|
| Executive, Architecture, Network, Security, Identity, Data, DataFlow, DataArchitecture, FullSubscription | **Yes** when compile is snapshot-scoped to a subscription (normal inventory workbench) |
| ResourceGroup | **No** — the RG is the outer container |
| SelectedResources | **No** unless options explicitly mark whole-subscription selection |
| DependencyNeighborhood | **No** — hop-focus is not a subscription map |

DataFlow / DataArchitecture: outer subscription frame **around** stage/type subgraphs is allowed as page chrome; do not replace those subgraphs.

If a snapshot ever contains multiple subscriptions, one outer frame **per** subscription (AABB non-overlap). Do not invent a fake tenant frame.

## Context

- Nested packer from IDX-05
- `DiagramForestLayoutSvgRenderer` viewBox / IDF-05 crop (`g.rg-frame` today — extend to `g.sub-frame` or equivalent)
- Graphviz cluster planner

## What to build

1. Emit `g.sub-frame` (name locked in tests) with ink distinct from RG (e.g. 2.5 px solid `#475569`, larger rx, inside label = subscription display name or id tail). Do not reuse peering dash.

2. Charge pad to the subscription cell only (same IDF-04 idea). Do not raise `ComponentHorizontalGap`.

3. Parser/title: keep `Azure inventory ({mode})`; label the frame, do not duplicate a huge title.

4. Tests:
   - FullSubscription / Executive / Network / Identity / Data / DataFlow: exactly one `g.sub-frame` wrapping RG frames on a single-subscription fixture.
   - ResourceGroup / SelectedResources / DependencyNeighborhood: **zero** `g.sub-frame`.
   - PNG DOT contains an outer cluster for FullSubscription and none for ResourceGroup.
   - Crop union includes the outer rect.

## Acceptance criteria

- Neighborhood node count is unchanged by this prompt (no extra subscription chrome pulling in nodes).

## Constraints

- **Do not** collapse singleton RGs here.
- **Do not** draw management-group / tenant frames.

## Done when

Full subscription PNG and forest show a subscription box; a `resourceGroup:{name}` compile does not.
