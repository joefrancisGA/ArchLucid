# UU-45 — Where the disposition went

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-46 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-45**). **Depends on:** `dispositionLastSavedUtc`. If UU-32 has landed, keep the plain disposition labels.

## Goal

After a disposition save, the form says the decision was recorded on this finding and the sealed review record is unchanged.

## Why

The form already shows a last-saved time. It does not say whether the save changed the finding, the sealed package, or Azure.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx` (`finding-disposition-last-saved`)

## What to build

1. Branch `uu/45-disposition-saved` from current `master`.
2. When `dispositionLastSavedUtc` is set, under the existing saved-time line, show: "Recorded on this finding. The sealed review record is unchanged."
3. Do not show that sentence before a save.
4. Do not change the saved enum value. Do not say the package is signed.

## Acceptance criteria

- A form with a saved time shows the sentence.
- A form with no saved time does not show it.
- The select still submits the enum value.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.test.tsx"
```

Add a saved-state test if that suite does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to save a disposition and read the sentence under the saved time. Wait for that look before any commit.
