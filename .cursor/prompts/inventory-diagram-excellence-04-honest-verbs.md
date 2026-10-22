# IDX-04 — Honest relationship verbs

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-02 (prefer IDX-03). **Do not** implement nested frames, PE UI, or teal provenance.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

Visible connector labels on inventory-forest, Export Mermaid, and Graphviz PNG use a closed verb list derived from `GraphEdgeTypes` + association roles — not generic `connects` — for every `DiagramMode`.

## Why

`CONTAINS`, `PEERS_WITH`, `APPLIES_TO`, `CAN_READ`, and composed placement all render as `connects` or get rewritten to `likely · in`. Humans reading Executive peering, Network placement, Identity federation, and DataFlow `uses` cannot tell them apart.

## Applies to every `DiagramMode`

| Mode | Verbs that must remain distinct |
|------|--------------------------------|
| Executive / Network | `peering` vs `in` vs `contains` |
| FullSubscription / Architecture / ResourceGroup | `in` / `contains` / `uses` / `applies` |
| Security | `applies` / `protects` (not `connects`) |
| Identity | `uses` / `member of` / `federates` |
| Data / DataArchitecture | `in` (PE placement) / `reads` / `writes` when `CAN_READ` / `CAN_WRITE` |
| DataFlow | `uses` / `reads` / `declared` (IDP `4 3` dash stays) |
| SelectedResources / DependencyNeighborhood | same verb table on the smaller edge set |

## Context

- `DiagramEdgeLabelHumanizer`
- `GraphEdgeTypes` in `ArchLucid.KnowledgeGraph/WellKnownGraph.cs`
- IDP-02 declared dash `4 3`; IDA-06 peering dash `6 4`; inferred dotted
- `DiagramForestLegendSvgEmitter`

## What to build

1. Closed display-verb map (own file) from `GraphEdgeTypes` / association type / inference source:

   | Role | Label |
   |------|-------|
   | CONTAINS / parent-child | `contains` |
   | composed / nicToSubnet / peToSubnet placement | `in` |
   | PEERS_WITH | `peering` |
   | APPLIES_TO (NSG/RT) | `applies` |
   | PROTECTS | `protects` |
   | USES_IDENTITY | `uses` |
   | CAN_READ / CAN_WRITE | `reads` / `writes` |
   | MAY_ACCESS | `may access` (Identity/Security/DataFlow only — still **no** Full-sub RBAC dump) |
   | FEDERATES_AS | `federates` |
   | MEMBER_OF | `member of` |
   | HumanAssertion / declared | `declared` (keep IDP label rules) |
   | collocation last-resort | `likely · in` |

2. Humanizer must not overwrite a more specific verb with `connects`. Unknown types fall back to a shortened edge type, never invent `connects` for `PEERS_WITH`.

3. Legend: reuse IDA-09 / IDF-03 rows; add verb examples only when those edges exist on **that mode's** canvas.

4. Tests: member data over all twelve `DiagramMode` values with a peering edge, a contains edge, and a placement `in` edge (skip a verb when the mode filter removes both endpoints — assert skip). Forest SVG, Mermaid string, and DOT all contain the verb text.

## Acceptance criteria

- No color-only encoding. No teal. No five-stroke provenance rainbow (**IDP-HOLD**).
- Peering stroke remains `6 4`; declared `4 3`; inferred dotted.

## Constraints

- **Do not** start IDX-05 frames.
- Verification: ArtifactSynthesis humanizer + compiler + Graphviz tests.

## Done when

Network and Executive fixtures show `peering` and `in` on the same canvas, and Identity shows `uses` rather than `connects`.
