# UU-10 — First-encounter definitions

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** `InlineGlossaryChip` and the load-bearing glossary nouns. If UU-02 or UU-03 has landed, do not remove the progress line or the object sentence.

## Goal

The first visible label of five nouns on the review workspace uses the glossary chip that already exists. The definition opens on that screen.

## Why

Finding, decision, policy pack, evidence trail, and sealed review record already have one-line meanings and an `InlineGlossaryChip`. Several review surfaces still show the word as plain text, so the meaning stays on `/help/glossary`.

## Read first

- `archlucid-ui/src/components/InlineGlossaryChip.tsx`
- `archlucid-ui/src/lib/load-bearing-glossary-nouns.ts`
- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` (labels: Findings, Decisions and remediation, Finalized review record, Policies and standards)
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/new/ReviewsNewPageChrome.tsx` (chips already here — do not duplicate them)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`

## What to build

1. Branch `uu/10-first-encounter-definitions` from current `master`.
2. Wrap the first visible heading or lead on these surfaces with the existing `InlineGlossaryChip`. One chip per noun per view. Do not wrap every later repetition.
   - Findings tab lead: noun `finding`
   - Decisions and remediation tab lead: noun `decision`
   - Policies and standards tab lead: noun `policy-pack`
   - Finalized review record tab lead, or the pre-finalize empty state if that chip is not already there: noun `sealed-review-record`
   - A review lead that says "evidence trail" without a chip: noun `evidence-trail`
3. `ReviewsNewPageChrome` and `RunDetailPreFinalizedEmptyState` already chip some of these nouns. If the chip is present, do not add a second one.
4. On path inspect, if the panel lead says "finding" as plain text, chip that first occurrence with noun `finding`. Do not chip kind names, band names, or hop sentences.
5. Use `pulseOnFirstEncounter` on that first chip. Reopen is the existing tooltip. The help link stays `/help/glossary#term-{id}`.
6. Do not edit glossary bodies, add nouns, or add a new tooltip component.
7. Do not put a chip inside a button label if that splits the accessible name. Chip the heading instead.
8. Do not change tab labels in `REVIEW_DETAIL_TAB_LABELS`. Chip the in-tab heading, not the tab strip.

## Acceptance criteria

- Each of the five nouns has a chip on the surface listed above, or the session note says the chip was already there.
- Tooltip text is the existing glossary short definition.
- Tab order and tab labels are unchanged.
- No new glossary entry.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Buyer copy stays "review", "finding", "decision", "policy pack", "evidence trail", and "sealed review record".
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/InlineGlossaryChip.test.tsx
```

Add a test that the findings tab lead renders the finding chip. Run that test too.

## Done when

Tests pass. Tell the owner to open Findings, Decisions and remediation, Policies and standards, and Finalized review record, and to hover the first chipped noun on each. Wait for that look before any commit.
