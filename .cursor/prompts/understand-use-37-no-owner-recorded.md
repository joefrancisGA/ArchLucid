# UU-37 — No owner recorded

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-38 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-37**). **Depends on:** the findings queue owner cell.

## Goal

A finding with no owner says that no owner is recorded.

## Why

The owner cell renders an em dash when `ownerUserId` is missing. A dash can mean the column failed to load.

## Read first

- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueOperationalRowCells.tsx` (the owner cell)
- `archlucid-ui/src/app/(operator)/governance/findings/governance-finding-queue-row.ts` (`ownerUserId`)

## What to build

1. Branch `uu/37-no-owner-recorded` from current `master`.
2. When a finding row has no owner, show "No owner recorded."
3. When a finding row has an owner, keep the existing owner text.
4. A decision row keeps the existing em dash. Do not call a decision an unowned finding.
5. Do not add an assign action and do not invent an owner.

## Acceptance criteria

- A finding with a null owner shows "No owner recorded."
- A finding with an owner still shows that owner.
- A decision row does not show "No owner recorded."

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The empty sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable.test.tsx"
```

Add a row test if that suite does not render the owner cell. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to find one row with an owner and one without, and read both cells. Wait for that look before any commit.
