# IE-DT-03 — Ratchet: `content-visibility` must not return on table rows

**Wave:** drift-table-layout (**IE-DT**). **Depends on:** IE-DT-01. **Do not** implement IE-DT-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A future perf pass must not copy `.content-visibility-auto` back onto `DESIGN_TOKENS.table.row` (or onto `thead` / `tbody` / `tr` / `td` / `th` via tokens). The owner screenshot is a one-line class regression; lock it in CI.

## Why

Perf wave 8 left a comment that the class “skips offscreen paint/layout for dense EnterpriseTable rows”. That sentence is the load-bearing mistake. Without a ratchet, the next INP pass will restore it because 100-row drift tables look expensive in a profiler while looking corrupt in a browser.

## Context

- `archlucid-ui/src/lib/design-tokens-shell-chrome.ts`
- `archlucid-ui/src/app/globals.css`
- `archlucid-ui/src/components/ui/enterprise-table.tsx`
- `archlucid-ui/src/lib/desk-ia-prompt-inventory.test.ts` — pattern for prompt-file inventory (optional extra in this prompt)
- After IE-DT-01: `table.row` has no `content-visibility-auto`

## What to build

1. Add `archlucid-ui/src/lib/design-tokens-table-content-visibility.test.ts` (or extend `design-tokens.test.ts` if that file already greps token strings):
   - Import `DESIGN_TOKENS` from `@/lib/design-tokens`.
   - For keys `shell`, `table`, `headRow`, `headCell`, `body`, `row`, `rowSelected`, `cell`, `cellSecondary`, `rowLabel`: `expect(DESIGN_TOKENS.table[key]).not.toMatch(/content-visibility/)`.
   - Read `enterprise-table.tsx` source with `fs.readFileSync` and assert it does not contain `content-visibility`.
   - Read `globals.css`. If `.content-visibility-auto` still exists, assert the comment (or a nearby line) forbids table-row use AND assert `design-tokens-shell-chrome.ts` does not contain `content-visibility-auto`. If the utility was deleted in IE-DT-01, assert the class name is absent from `globals.css`.
2. Optional but preferred: `archlucid-ui/src/lib/drift-table-layout-prompt-inventory.test.ts` modeled on `desk-ia-prompt-inventory.test.ts`:
   - `.cursor/prompts/` contains `drift-table-layout-00-index.md` and `drift-table-layout-01-` through `drift-table-layout-04-` files (length 4 numbered files).
   - Do not parse prompt bodies.
3. Do **not** change visual CSS except to keep IE-DT-01’s removal. If IE-DT-01 is not in the tree, stop.

## Acceptance criteria

- `npx vitest run` on the new/extended file fails if `content-visibility-auto` is added back to `DESIGN_TOKENS.table.row`.
- Prompt inventory (if added) lists 00 + 01–04.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** implement Playwright (IE-DT-04). **Do not** revert IE-DT-01.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Verification: from `archlucid-ui/`, `npx vitest run src/lib/design-tokens-table-content-visibility.test.ts src/lib/drift-table-layout-prompt-inventory.test.ts` (omit inventory path if you skipped it). Also run `src/lib/design-tokens.test.ts` if you edited that file instead.
