# DCU-02 — One legend, with a drawn stroke

**Wave:** diagram consumption UX (**DCU**). **Depends on:** current master. **Do not** implement DCU-03–05. DCU-01 may land in parallel if it does not edit the legend block.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The diagrams page explains the mode in one sentence and explains connector strokes in one legend. Probable authorization stays distinct from inferred hostname match. Each stroke row includes a drawn sample, not color alone.

## Why

`InfraDiagramLegend` inside `DiagramsWorkbenchClient` tells every mode: “Observed means inventory evidence; derived means an inferred connection.” That sentence collapses **May access** (probable, dashed) and **Likely connected to** (inferred, dotted). `InfraEvidenceDiagramLegend` already has separate copy constants in `infra-evidence-diagram-copy.ts`, and it renders only when those edges exist. Operators see both blocks.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` — `InfraDiagramLegend`, `infraDiagramModeJobCaption`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramLegend.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-copy.ts`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx`

## What to build

1. Keep a single mode job sentence above the canvas:
   - Data flow: “This diagram shows what may connect. It is not observed traffic.”
   - Data architecture: “This diagram shows what stores data.”
   - Other modes: no extra job sentence.
2. Remove the “Relationship provenance” bullet that defines derived as inferred. Do not leave a second provenance definition on the page.
3. In `InfraEvidenceDiagramLegend`, draw a short sample next to each visible row:
   - Solid line for observed.
   - Dashed line for declared and for probable (separate rows; same dash language the canvas already uses).
   - Dotted line for inferred.
   The sample is `aria-hidden`. The words stay in the list item so the meaning is not color-only or stroke-only.
4. Keep the hostname footnote when inferred edges are present. Keep the resource-category swatches.
5. Do not change `DiagramEdgeVisualKindResolver` or forest SVG dash styles.

## Acceptance criteria

- Data flow tests no longer expect the sentence “derived means an inferred connection.”
- A probable outline still shows the probable legend row and a dashed sample.
- An inferred outline still shows the inferred row, a dotted sample, and the hostname footnote.
- A diagram with only observed edges shows the observed row and does not invent probable or inferred rows.

## Constraints

- Working-tree safety before tracked edits.
- Sentence case. `OPERATOR_TYPOGRAPHY`. Neutral surfaces — no new pastel legend card.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
cd archlucid-ui && npx vitest run \
  src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx \
  src/app/\(operator\)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

Heartbeat every 8s if the run exceeds 15s.

## Done when

A reviewer can match a dashed **May access** line to the probable legend row, and the page no longer calls that line inferred.
