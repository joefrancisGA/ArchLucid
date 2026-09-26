# UU-56 — See the saved disposition in the decision register

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-57 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-56**). **Depends on:** UU-45. Keep the saved sentence.

## Goal

After a disposition save, the form links to the existing decision register.

## Why

The form says the decision was recorded on this finding and the sealed review record is unchanged. It does not say where to read that decision with the other recorded decisions.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx` (`finding-disposition-last-saved`)
- `archlucid-ui/src/app/(operator)/governance/decision-register/DecisionRegisterNextReviewFooter.tsx` (`decisionRegisterNextReviewHref`)
- `archlucid-ui/src/lib/governance/governance-route-paths.ts` (`GOVERNANCE_DECISION_REGISTER_PATH`)

## What to build

1. Branch `uu/56-see-decision-register` from current `master`.
2. When `dispositionLastSavedUtc` is set, under the existing sentence "Recorded on this finding. The sealed review record is unchanged.", add a link labeled "See it in the decision register."
3. When `runId` is non-empty, the href is `decisionRegisterNextReviewHref(runId)`. Otherwise the href is `GOVERNANCE_DECISION_REGISTER_PATH`.
4. Do not show the link before a save. Do not create a register, a decision, or a new route. Do not change the saved enum value.

## Acceptance criteria

- A form with a saved time shows the link under the saved sentence.
- A form with no saved time does not show the link.
- A non-empty `runId` puts `runId` on the decision-register href.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The link label is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.test.tsx"
```

Add a saved-state link test if that suite does not cover the new link. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to save a disposition and follow "See it in the decision register." Wait for that look before any commit.
