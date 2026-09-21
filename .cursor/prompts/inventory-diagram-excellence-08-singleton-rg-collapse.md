# IDX-08 — Singleton resource-group collapse

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-06. **Do not** merge disconnected components into one fake RG.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

On subscription-scoped forests with many one-node resource-group frames, collapse the **tail** into one summary frame `Other resource groups (N)` that lists count + top names, with an expand path (outline row or neighborhood seed on a member). Keep singleton frames that have a **cited inter-RG hop**.

## Why

Visio-style packing draws a frame per named RG including singletons. Full subscription becomes a postage sheet of one-runbook groups. Humans lose the connected systems in the noise.

## Applies to every `DiagramMode`

| Mode | Collapse? |
|------|-----------|
| FullSubscription / Executive / Architecture | **Yes** when singleton named frames exceed a locked threshold (suggest ≥ 8; named constant) |
| Network / Security / Identity / Data | **Yes** with the same threshold on **that mode's** remaining singleton RGs |
| DataFlow / DataArchitecture | Only ARM-located singleton RGs that are not a required stage/type member; never collapse a stage away |
| ResourceGroup | **Never** — the user already chose one RG |
| SelectedResources / DependencyNeighborhood | **Never** — hop-focus must not hide the seed's RG |

## Context

- `DiagramResourceGroupPacker` singleton named cells
- Outline Nodes table (IDA-10) as expand surface — reuse, do not add a nav item
- Walkthrough copy `{n} resources in {c} connected components`

## What to build

1. Collapse planner (own file): partition named cells with `Nodes.Count == 1` and **no** cited inter-RG edge. Sort remaining large/connected RGs first. Overflow → one summary cell with `IsCollapsedResourceGroupTail = true` (name locked).

2. Summary card: `Other resource groups (N)` plus up to three member names. Click/focus: existing outline or `dependencyNeighborhood` with seed = first member (do not invent a new canvas engine).

3. Threshold constant on `DiagramForestLayoutOptions`. Below threshold, keep today’s singleton frames (Visio honesty).

4. Tests:
   - 12 singleton RGs + 2 multi-node RGs, no inter-RG hops → 2 real frames + 1 summary (FullSubscription, Executive, Network).
   - Singleton with cited peering/ARM-id to another RG → **not** collapsed.
   - ResourceGroup / neighborhood / selected: summary count 0.
   - DataFlow: stage nodes still visible.

## Acceptance criteria

- Walkthrough resource count still counts collapsed members (do not lie that they vanished).
- PNG: summary cluster present for FullSubscription; absent for ResourceGroup.

## Constraints

- **Do not** merge two connected components just to keep a singleton out of the tail.
- **Do not** hide desktop tabs behind More.

## Done when

Full subscription no longer paints a dozen one-node RG boxes when those RGs have no cited hops, and ResourceGroup mode is unchanged.
