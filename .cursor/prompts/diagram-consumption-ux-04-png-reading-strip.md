# DCU-04 — PNG reading strip

**Wave:** diagram consumption UX (**DCU**). **Depends on:** DCU-02, so the strip uses the same legend sentences. **Do not** implement DCU-05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Every downloaded diagram PNG carries a short reading strip under the picture: the mode job sentence when one exists, the stroke rows that apply to this diagram, and the completeness-warning count when warnings exist.

## Why

`downloadInfraEvidenceMermaidPng` in `infra-evidence-mermaid-api.ts` saves the server PNG, or a browser raster of the SVG, and returns. `InfraEvidenceDataFlowCaptionDisclosure`, `InfraEvidenceDiagramLegend`, and `InfraEvidenceCompletenessWarningsBanner` stay on the page. A slide made from the file has the connectors and none of the honesty.

## Read first

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-api.ts` — `downloadInfraEvidenceMermaidPng`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-copy.ts`
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` — `runPngExport`
- `ArchLucid.ArtifactSynthesis` data-flow honesty sentences, read-only — reuse the same wording the page already shows

## What to build

1. After the PNG blob exists (server or browser fallback), composite a footer band before `triggerBrowserBlobDownload`. Do this in a helper in its own file. Do not change the Mermaid source and do not change the on-page SVG.
2. Footer contents, in this order, omitting empty lines:
   - Data flow job sentence: “This diagram shows what may connect. It is not observed traffic.”
   - Data architecture job sentence: “This diagram shows what stores data.”
   - One line per stroke row that `InfraEvidenceDiagramLegend` would show for this outline (observed, declared, probable, inferred), using the existing copy constants.
   - When `completenessWarnings.length > 0`: “Inventory completeness warnings (N). Connection lines may be missing.”
3. Use a white band and neutral near-black text in both color schemes. The strip is readable when printed. Do not paint TLS, classification, or a percent.
4. Pass the outline, mode, and warning list from `runPngExport` into the download helper. The too-large server-only path gets the same strip.
5. Tests: a data-flow PNG request path builds footer text that includes the job sentence and excludes it for Network mode; a warning list of length 2 includes “Inventory completeness warnings (2)”; the helper does not add “observed traffic” as a claim that flow happened.

## Acceptance criteria

- The file the browser saves includes the strip.
- Network mode does not gain the data-flow job sentence.
- Warning text does not include secret values or a raw ARM id longer than the banner already shows. Prefer the existing human title from `resolveInfraEvidenceCompletenessWarningPresentation` for at most the first three warnings, then “and M more” when needed.

## Constraints

- Working-tree safety before tracked edits.
- No new API field. No collector.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
cd archlucid-ui && npx vitest run \
  src/lib/infra-evidence/infra-evidence-mermaid-api.test.ts
```

Add the footer helper’s own Vitest file. Heartbeat every 8s if the run exceeds 15s.

## Done when

A downloaded Data flow PNG still shows the picture and also shows the job sentence and the warning count when warnings were on the page.
