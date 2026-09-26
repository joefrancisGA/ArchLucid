# UU-07 — One next action on the sealed package

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-08 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** `resolveReviewPackageDoThisNext`, which already computes one next action.

## Goal

On a sealed review, the first viewport has one primary next action. The other package artifacts are links under that action.

## Why

Finalize produces a first-value report, a sponsor brief, and other exports. The package view can present more than one of them as a filled primary button. The resolver already has a single next action.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-review-package-do-this-next.ts`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageDoThisNextResolved.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspaceShell.tsx`
- `docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md` (the artifact list — do not delete artifacts)

## What to build

1. Branch `uu/07-package-next-action` from current `master`.
2. Read the strip and the package tab before adding UI. If a sealed review already shows one filled primary button and the other artifacts as links, add a test that locks that behavior and stop. Do not add a second strip.
3. If two filled primary buttons compete, keep the action from `resolveReviewPackageDoThisNext` as the only filled primary. Render the other artifacts as links in the existing quick-link list.
4. The sentence and the button label come from that resolver. Do not put a CLI command, a script name, or `runId` in the visible sentence.
5. Do not remove exports. A person can still open the sponsor brief, the first-value report, and the package downloads from the links.
6. Do not add a tab. Do not move review tabs into More.

## Acceptance criteria

- A sealed review renders one primary button for the next action.
- At least one other artifact remains reachable as a link when the package has more than one artifact.
- An unsealed review still uses the existing unfinished-step action. Do not force "Send the sponsor brief" before seal.
- Visible copy says "review" and "architecture package".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- `Button` variants stay `default` or `outline`. Links stay links.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.test.tsx" "src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-review-package-primary-action.test.ts"
```

Extend the strip test so a sealed package has one primary action. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a sealed review and count filled primary buttons in the first viewport. There should be one. Wait for that look before any commit.
