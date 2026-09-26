# UU-01 — Signed-in home job chooser

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-02 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** the existing product-line switch.

## Goal

The signed-in home shows two jobs. Each job names its outcome. Choosing a job selects the product line that already exists.

## Why

ArchLucid and SecureNow share one signed-in shell. The home opens whichever line is already selected. A person looking for a sealed architecture package can land in SecureNow, and a person looking for what an Azure estate can reach can land in an architecture review.

## Read first

- `archlucid-ui/src/components/product-line/ProductLineHomeSwitch.tsx`
- `archlucid-ui/src/components/product-line/ProductLineHomeSwitch.test.tsx`
- `archlucid-ui/src/components/product-line/ProductLineSwitchBar.tsx`
- `archlucid-ui/src/lib/product-line/product-line-copy.ts`
- `archlucid-ui/src/app/(operator)/page.tsx`
- `docs/library/CONCEPT_VOCABULARY.md` (persona nouns and review versus run)

## What to build

1. Branch `uu/01-job-chooser` from current `master`.
2. On the architecture signed-in home, above the existing dashboard, render two jobs:
   - **Review an architecture.** Outcome line: "You get a finalized architecture package." Selecting it sets the product line to `architecture` and stays on `/`.
   - **See what this Azure estate can reach.** Outcome line: "You get a ranked path you can inspect." Selecting it sets the product line to `security` and stays on `/`.
3. On that architecture process, the current product line is the selected job and the other job stays visible, including after switching to the SecureNow dashboard. The SecureNow process home does not render the chooser.
4. Use the existing `setProductLine` path. Do not add a product line, a route, or a sidebar assignment.
5. When this Next.js process cannot host the architecture home (the existing security-env hint), keep that hint. Do not show a control that claims to switch lines and then leaves the person on the hint.
6. Leave `ProductLineSwitchBar` on the internal product-line page as it is. This prompt changes the home, not that playground.

## Owner correction (2026-09-26)

SecureNow is not for reviewing architectures. The SecureNow process home does not render this chooser. Show both jobs on the architecture home, and keep them when that same process is showing the SecureNow dashboard so the architecture job can be selected again. Do not put "Review an architecture" on a SecureNow home that cannot host it.

## Acceptance criteria

- Architecture home shows both jobs, with architecture selected.
- SecureNow process home does not show "Review an architecture".
- Activating the other job calls the existing product-line setter.
- Copy says "architecture package" and "ranked path". It does not say "run" for the review, and it does not say "operator".
- The security-env hint screen does not grow a switch that cannot change the process.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case for the job titles and outcome lines.
- Buttons that switch the product line use a visible `Button` variant (`default` or `outline`). Do not use `ghost` or `link`.
- Do not hide navigation.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/product-line/ProductLineHomeSwitch.test.tsx
```

## Done when

Tests pass. Tell the owner to open `/` on each product line and confirm the selected job matches the dashboard underneath. Wait for that look before any commit.
