# UU-06 — Diagram job titles

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-07 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** inventory diagram mode ids already in the filter URL.

## Goal

The Data, Data architecture, and Data flow choices say what each diagram is for. Their URL values stay the same.

## Why

`INFRA_DIAGRAMS_MODE_OPTIONS` labels those modes "Data", "Data architecture", and "Data flow diagram". Data is a category filter on the infrastructure forest. The other two are separate diagrams. The labels do not say that.

## Read first

- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-data-flow-diagram.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the diagram type control only)
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.tsx`

## What to build

1. Branch `uu/06-diagram-job-titles` from current `master`.
2. Change labels only. Do not change `value` strings, so existing URLs keep working.
   - `data`: "Data category"
   - `dataArchitecture`: "Data architecture — what stores what"
   - `dataFlow`: "Data flow — what may connect"
3. When one of those three modes is selected, show one caption under the diagram type control:
   - `data`: "This view filters the infrastructure forest to data resources."
   - `dataArchitecture`: "This diagram shows what stores data."
   - `dataFlow`: "This diagram shows what may connect. It is not observed traffic."
4. Keep `INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX` ("Declared pipeline wiring, not observed traffic."). Do not delete the existing data-flow caption disclosure.
5. Do not merge modes. Do not change the Mermaid compiler, layout, or icon mapping. Do not rename Executive, Network, Identity, or the other modes.

## Acceptance criteria

- `parseInfraDiagramsMermaidModeFromSearch("data")`, `"dataFlow"`, and `"dataArchitecture"` still return those values.
- The picker shows the three new labels.
- Selecting each of the three shows its caption.
- Other mode labels are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case for the caption sentences. The labels above are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts
```

Add a test for the caption helper if you extract one. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open inventory diagrams and switch Data category, Data architecture, and Data flow. Each caption should match the mode. Wait for that look before any commit.
