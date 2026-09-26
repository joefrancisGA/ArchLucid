# UU-29 — Keep the next action in view

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-30 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-29**). **Depends on:** `ReviewPackageDoThisNextStrip`. If UU-07 has landed, keep one filled primary.

## Goal

While a review workspace scrolls, the one primary next action stays visible. The tab strip stays where it is.

## Why

The next action is the way out of a long findings or evidence tab. After the reader scrolls, the action is above the fold they left.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceStickyActions.tsx`
- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `uu/29-sticky-next-action` from current `master`.
2. Pin the existing next-action strip under the review header while the workspace scrolls. Reuse `RunDetailWorkspaceStickyActions` if it already pins actions. Do not create a second next-action strip.
3. The pinned region contains the one primary action and its sentence. Secondary links may wrap under it. They do not become extra filled buttons.
4. The tab strip remains in its current place, including overflow tabs. Do not move a tab into More to make room.
5. On a short page where the strip is already visible, do not duplicate it.

## Acceptance criteria

- Scrolling a long review tab keeps one primary action visible.
- The tab labels and tab order are unchanged.
- An unsealed review still shows its unfinished-step action, not a sponsor send action.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The pinned region uses the existing surface color. Do not add a tinted bar.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.test.tsx"
```

## Done when

Tests pass. Tell the owner to open a long findings tab, scroll, and confirm the same primary action is still visible and the tabs are still in the strip. Wait for that look before any commit.
