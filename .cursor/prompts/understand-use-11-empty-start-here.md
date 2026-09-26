# UU-11 — Start here on empty screens

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-12 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-11**). **Depends on:** `EnterpriseCompactEmptyState`, which already accepts link actions.

## Goal

Three empty screens each offer one action that starts the missing work. The action uses a route that already exists.

## Why

An empty diagram, an empty path inspect panel, and an empty findings queue tell the reader what is missing. They do not always name the one next place to go.

## Read first

- `archlucid-ui/src/components/EnterpriseCompactEmptyState.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (empty content state)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (no selection)
- The governance findings queue empty state. Search `GovernanceFindingsQueue` for the empty preset.
- The existing extract-upload and new-review route constants. Do not invent a path.

## What to build

1. Branch `uu/11-empty-start-here` from current `master`.
2. Change only these three empty states:
   - Inventory diagrams with nothing to draw: primary action "Upload inventory" to the existing extract-upload route.
   - Path inspect with no selected row: primary action "Open ranked paths" to the existing remediation-factory route.
   - Findings queue with no rows: primary action "Start an architecture review" to the existing new-review route.
3. Pass the action through `EnterpriseCompactEmptyState` `actions`. One primary action. A second outline action is allowed only when that empty state already has one.
4. Do not add an action to every empty state in the repo.
5. Do not add a button that uploads, starts a review, or selects a path by itself. The control is a link to the existing page.

## Acceptance criteria

- Each of the three empty states shows its one action label.
- The href is an existing in-app route.
- A non-empty diagram, a selected path, and a non-empty findings queue do not show that empty action.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. `Button` links use `default` or `outline`. Do not use `ghost` or `link`.
- **Do not commit.**

## Verification

There is no `EnterpriseCompactEmptyState.test.tsx`. Add a test beside each of the three call sites, or one helper test that the three empty-state presets include the action label and href. Run only those tests.

```powershell
cd archlucid-ui
npx vitest run src/components/EmptyState.test.tsx
```

## Done when

Tests pass. Tell the owner to open each empty screen and use the action. Wait for that look before any commit.
