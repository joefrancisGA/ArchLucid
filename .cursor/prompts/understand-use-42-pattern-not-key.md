# UU-42 — Pattern, not the key

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-43 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-42**). **Depends on:** `patternKey` on the priority queue.

## Goal

The priority queue leads with the word Pattern. The pattern key stays available in the existing identifier disclosure.

## Why

A cell that shows `storage.encrypt` asks the reader to decode a key before they know it is a pattern name.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityTable.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the priority table and the selection label)
- The inspect identity header that already has "Show identifiers"

## What to build

1. Branch `uu/42-pattern-not-key` from current `master`.
2. When a row has a `patternKey`, the visible cell text is "Pattern".
3. Put the raw key in the existing Show identifiers disclosure for that finding. Do not drop the key.
4. When `patternKey` is missing, keep the existing em dash.
5. The selection label may keep the key only inside that same disclosure. The lead text stays "Pattern" or the existing finding label without the raw key first.

## Acceptance criteria

- A row with `storage.encrypt` shows "Pattern" in the cell.
- Show identifiers still reveals `storage.encrypt`.
- A row with no pattern key does not show "Pattern".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not invent a friendlier pattern name.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to read a priority row, then open Show identifiers and confirm the key is still there. Wait for that look before any commit.
