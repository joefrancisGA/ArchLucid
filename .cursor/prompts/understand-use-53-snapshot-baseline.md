# UU-53 — From is the baseline

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-54 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-53**). **Depends on:** the SecureNow snapshot comparison.

## Goal

The snapshot comparison says which side is the baseline.

## Why

From and To are two chosen snapshots. The inverted-pair warning already asks for an earlier From and a later To. The page still does not say what those two roles mean before a warning appears.

## Read first

- `archlucid-ui/src/components/security/SecureNowArchitectOutcomeMetricsPanel.tsx` (`SnapshotIdentityDisclosure`, and the inverted-pair warning)

## What to build

1. Branch `uu/53-snapshot-baseline` from current `master`.
2. Next to the existing From / To scope line, show: "From is the baseline. To is the snapshot you compare against."
3. Show that sentence whenever the From and To controls are on the page, including when a side is not selected yet.
4. Keep the existing inverted-pair warning. Do not swap the selected snapshots. Do not change which snapshot is From or To.

## Acceptance criteria

- The sentence is visible above or beside the From / To scope line.
- An inverted pair still shows the existing warning.
- The selected snapshot ids are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecureNowArchitectOutcomeMetricsPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to read the baseline sentence, then the From and To labels. Wait for that look before any commit.
