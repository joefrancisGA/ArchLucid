# UU-20 — Visible queue shortcuts

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-20**). **Depends on:** `FINDINGS_PAGE_SHORTCUTS` and `REMEDIATION_FACTORY_PAGE_SHORTCUTS`.

## Goal

The findings queue and the ranked-path queue show the keyboard shortcuts for next, previous, open evidence, open remediation, and return to the queue.

## Why

`alt+j` and `alt+k` already move through findings and ranked rows. `alt+i` already focuses path inspect. The keys are easy to miss because the queue does not show them.

## Read first

- `archlucid-ui/src/lib/shortcut-registry.ts` (`FINDINGS_PAGE_SHORTCUTS`)
- `archlucid-ui/src/lib/shortcut-registry.test.ts`
- `archlucid-ui/src/lib/remediation-factory/remediation-factory-page-shortcuts.ts`
- `archlucid-ui/src/components/ShortcutHint.tsx`
- `archlucid-ui/src/integration/keyboard-shortcuts-findings.test.tsx`
- `archlucid-ui/src/integration/keyboard-shortcuts-input-guard.test.tsx`

## What to build

1. Branch `uu/20-queue-shortcuts` from current `master`.
2. On the findings queue and the remediation-factory ranked-path list, show a `ShortcutHint` row for the actions that already have keys:
   - Next row: existing `alt+j`.
   - Previous row: existing `alt+k`.
   - Open the inspect panel: existing `alt+i` on the remediation factory. On findings, add `alt+i` only if that page does not already use it.
3. Add two shortcuts where they do not already exist, and show them in the same hint row and in the shortcuts dialog:
   - Open evidence: `alt+o` moves focus to the evidence link or evidence tab for the selected row. If the row has no evidence link, do nothing.
   - Return to the queue: `alt+q` moves focus back to the selected row.
4. Do not change `alt+1`, `alt+2`, or `alt+3`. Do not reuse a key that `shortcut-registry` already assigns on that page.
5. Ignore the new keys while focus is in an input, textarea, select, or contenteditable. Follow the existing input guard.
6. Do not add a shortcut that finalizes a review, applies a change, or writes to Azure.

## Acceptance criteria

- The remediation factory shows hints for `alt+j`, `alt+k`, and `alt+i`.
- `alt+o` and `alt+q` are listed once each on that page.
- Pressing `alt+j` inside a text input does not change the selected row.
- The shortcut dialog includes the new labels.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Visible labels are sentence case. Key names stay the existing `alt+` form.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/shortcut-registry.test.ts src/integration/keyboard-shortcuts-findings.test.tsx src/integration/keyboard-shortcuts-input-guard.test.tsx
```

Add a remediation-factory shortcut test if none covers the hint row. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open the ranked-path list, read the hints, and press `alt+j` and `alt+q`. Wait for that look before any commit.
