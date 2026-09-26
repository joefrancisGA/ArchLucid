# UU-24 — Three sentences for the sponsor

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-25 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-24**). **Depends on:** the sealed review package and the existing next-action resolver. If UU-07 has landed, keep its single primary action.

## Goal

A sealed review opens with three sentences a sponsor can read before the artifacts: what was reviewed, what blocks sharing, and what to send.

## Why

The package tab already holds the next action and the exports. A sponsor still has to infer which sentence is the review, which is the blocker, and which file to send.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-review-package-do-this-next.ts`
- `docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`

## What to build

1. Branch `uu/24-sponsor-read-first` from current `master`.
2. On a sealed review, above the existing next-action control, show three labeled lines:
   - Reviewed: the review title already on the page, plus "Finalized architecture package."
   - Sharing: "Nothing on this package blocks sharing." when the resolver has no blocker. Otherwise the existing blocker sentence, unchanged.
   - Send: the existing primary action label, as text. The button under it stays the only filled primary.
3. Do not show this block on an unsealed review.
4. Do not add a second primary button. Do not remove exports.
5. Do not put a CLI command or `runId` in the three lines.

## Acceptance criteria

- A sealed review with no blocker shows the three labels in that order.
- An unsealed review does not show the block.
- The existing primary action is still the only filled primary button.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The labels are Reviewed, Sharing, and Send.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.test.tsx"
```

## Done when

Tests pass. Tell the owner to open a sealed review and read the three lines before using the button. Wait for that look before any commit.
