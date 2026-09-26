# UU-32 — Plain disposition labels

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-33 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-32**). **Depends on:** `FindingInspectDispositionForm` and `dispositionTransitionCopy`.

## Goal

The disposition control shows a plain label. The value saved to the API stays the existing enum.

## Why

The select options render `Accepted`, `Deferred`, `NeedsEvidence`, and `RejectedAsNotApplicable`. Those are stored names. The helper under the select talks about the audit trail before it says what the choice means.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx`
- `archlucid-ui/src/lib/findings/finding-governance-action-copy.ts` (`dispositionTransitionCopy`)

## What to build

1. Branch `uu/32-disposition-words` from current `master`.
2. Add a display label for each option the form already lists. Use these strings:
   - Accepted → "Accept the risk"
   - Deferred → "Decide later"
   - NeedsEvidence → "Need more evidence"
   - RejectedAsNotApplicable → "Does not apply"
   - Remediated → "Change is done"
3. An option that is not in that list keeps its current text. Do not add a new disposition.
4. Lead `dispositionTransitionCopy` with one sentence for the selected value, then keep the existing fact that the finalized review record is not automatically changed.
   - Accept the risk: "The finding stays, and the accepted risk is recorded."
   - Decide later: "The finding stays open until the revisit date."
   - Need more evidence: "The finding stays open until more evidence is recorded."
   - Does not apply: "The finding does not apply to this review."
   - Change is done: "The change is recorded as done."
5. The select `value` stays the enum. Do not rename the enum.

## Acceptance criteria

- The open select shows "Does not apply" for `RejectedAsNotApplicable`.
- Saving still submits the enum value.
- The helper still says the finalized review record is not automatically changed.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case for the new labels above. They are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/findings/finding-governance-action-copy.test.ts "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.test.tsx"
```

Add a label test if one of those files does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open the disposition select and read "Does not apply" before saving. Wait for that look before any commit.
