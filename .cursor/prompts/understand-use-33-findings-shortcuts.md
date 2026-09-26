# UU-33 — Show the findings shortcut keys

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-34 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-33**). **Depends on:** `FINDINGS_PAGE_SHORTCUTS`. If UU-20 has landed, do not remove the remediation-factory shortcut row.

## Goal

The findings queue shows the shortcut keys it already binds.

## Why

`alt+j`, `alt+k`, `alt+1`, `alt+2`, and `alt+3` are registered for findings. The queue header does not show them, so the reader cannot discover next, previous, or the disposition keys.

## Read first

- `archlucid-ui/src/lib/shortcut-registry.ts` (`FINDINGS_PAGE_SHORTCUTS`)
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx`
- `archlucid-ui/src/components/ShortcutHint.tsx`
- The remediation factory shortcut row, as the pattern to copy: `RemediationFactoryClient.tsx`

## What to build

1. Branch `uu/33-findings-shortcuts` from current `master`.
2. Under the findings queue title, show one row of the existing findings keys: next, previous, accept, remediate, and reject as not applicable. Use `ShortcutHint` and the labels already in `FINDINGS_PAGE_SHORTCUTS`.
3. Do not bind a new key. Do not change what `alt+1`, `alt+2`, or `alt+3` do.
4. If those disposition keys already require an Execute capability, keep that gate. Say "when triage keys are enabled" in the helper. Do not say "operator".
5. Do not hide a review workspace tab to make room.

## Acceptance criteria

- The findings queue shows `alt+j` and `alt+k`.
- The row does not appear on the remediation factory.
- No new shortcut is added to the registry.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. Keys stay in `ShortcutHint`.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.test.tsx" src/lib/shortcut-registry.test.ts
```

Add a header test if the queue client suite does not render the shortcut row. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open the findings queue and read the key row before using it. Wait for that look before any commit.
