# UU-08 — Sample versus yours

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-09 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** the claims-intake sample review id and the data-flow honesty caption.

## Goal

The first viewport says when the open architecture package is the sample, and why a data-flow canvas has nothing to draw.

## Why

`GraphSampleModeBanner` already marks the sample evidence graph. The claims-intake review workspace and an empty data-flow diagram do not say, in the first viewport, what is sample and what your subscription would add.

## Read first

- `archlucid-ui/src/lib/samples/claims-intake/definition.ts` (`CLAIMS_INTAKE_SAMPLE_RUN_ID`)
- `archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-data-flow-diagram.ts`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`

## What to build

1. Branch `uu/08-sample-vs-yours` from current `master`.
2. On the review workspace, when the review id is `claims-intake-modernization`, show a status banner in the first viewport on every tab:
   - Title: "This is a sample architecture package."
   - Body: "The findings and exports here are demo data. A review of your subscription adds your evidence."
3. Follow `GraphSampleModeBanner` for structure (`role="status"`, warning callout token). On first paint the title and body are both visible. Do not start collapsed.
4. On inventory diagrams, when the selected mode is `dataFlow` and the diagram has no edges, show this line in the first viewport, outside any collapsed disclosure:
   - "This data-flow canvas is empty. The snapshot has inventory and no declared connection to draw."
5. Keep "Declared pipeline wiring, not observed traffic." Do not say traffic was proven absent. Empty means no declared connection to draw.
6. A data-flow diagram that has edges does not show the empty line.
7. A review that is not the claims-intake sample does not show the sample banner.

## Acceptance criteria

- The sample review shows the banner. Another review id does not.
- Data flow with zero edges shows the empty line without opening a disclosure.
- Data flow with an edge does not show the empty line.
- Copy does not call the sample an evaluation of product maturity.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Use the existing warning callout token. Do not add a pastel card.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner.test.tsx" src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.test.tsx
```

Add tests for the new banner and the empty data-flow line. Run those tests.

## Done when

Tests pass. Tell the owner to open the claims-intake review and a data-flow diagram with no edges. Both messages should be visible without a click. Wait for that look before any commit.
