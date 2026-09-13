<!-- Drift-table layout — Composer prompts. Paste one numbered file per
     session. Origin: 2026-09-13 owner screenshot of /governance/infrastructure/drift:
     snapshot pickers readable, change table a wall of overlapping microscopic
     text. Do not implement from this index. -->

# Drift workbench table layout — Composer prompt set (IE-DT-01–IE-DT-04)

ArchLucid sells a **seat for a repeat professional**. Drift & snapshots is an all-day SecureNow tool. A change table that paints as overlapping 1-character columns is not a density choice — it is a broken table layout.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/drift-table-layout-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_DRIFT_TABLE_LAYOUT_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not continue IE-UX-01, IDS, IDT, IDH, or IDG.** Those waves shipped the workbench and diagrams. This wave is the leftover: **perf wave 8 put `content-visibility: auto` on every `EnterpriseTable` `<tr>`**, which Chromium cannot lay out as a table.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot (2026-09-13): `/governance/infrastructure/drift` (**Drift & snapshots**). Title, lead, **Current snapshot** / **Diff vs other snapshot** pickers, risk/change-type filters, and **Export advisory Terraform** are still readable. The **Inventory drift changes** table is a tall wall of overlapping microscopic text. Column labels (Resource, Resource group, Resource type, Change, Property, Risk) are barely scanable. Rows are not discrete Carbon table rows.

Causal chain (locked):

1. **Perf wave 8 applied `content-visibility: auto` to every EnterpriseTable row.** `DESIGN_TOKENS.table.row` in `archlucid-ui/src/lib/design-tokens-shell-chrome.ts` includes `content-visibility-auto`. `EnterpriseTableRow` puts that class on `<tr>`.
2. **The utility skips table layout.** `archlucid-ui/src/app/globals.css` `@layer utilities`:
   ```css
   .content-visibility-auto {
     content-visibility: auto;
     contain-intrinsic-size: auto 48px;
   }
   ```
   CSS containment / `content-visibility` is not defined for `display: table-row` in a way Chromium can keep the table width algorithm. Skipped cells are not measured. Column widths collapse. Text still paints, wrapping to ~1-character columns, and rows overlap.
3. **Drift is the worst case, not a unique dialect.** `CHANGES_PAGE_SIZE = 100` in `DriftWorkbenchClient.tsx`, six columns, `StatusTag` / `SeverityTag` in cells, `variant="full"`. The same token hits Reviews, findings queue, audit, resource explorer. The owner noticed it here because this page dumps many rows at once.
4. **This is not a zoom, hydration-double-paint, or missing-data bug.** Controls above the table are intact. The API rows are present — they are unreadable.

Signature: **pickers readable, table is overlapping microscopic text, EnterpriseTable still used, `content-visibility-auto` still on `DESIGN_TOKENS.table.row`.**

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Table-row containment** | `content-visibility: auto` on every `<tr>` | Normal table-row layout; no `content-visibility` / `contain` on `display: table-row` | IE-DT-01 |
| **Readable density** | Collapsed 1-char wrap even after 01 if cells have no min-width | Carbon row height, wrapping at word boundaries, sticky header, tags stay in-cell | IE-DT-02 |
| **Token ratchet** | Utility can be re-added to `table.row` | Source tests fail if `content-visibility` returns on table rows | IE-DT-03 |
| **Owner-shape ratchet** | No browser proof the drift table rows do not overlap | Playwright mock: N change rows have non-overlapping boxes and ≥13px type | IE-DT-04 |

## What this set does *not* change

Keep: IE-UX-01 workbench (snapshot picker, diff picker, filters, export ZIP, Ask link, change drawer, URL sync). `CHANGES_PAGE_SIZE` paging / Load more. `StatusTag` / `SeverityTag` for Change and Risk. `EnterpriseTable` as the dialect (`UI_DESIGN_SYSTEM.md` inventory / master-detail). Plane: one Azure collector, no `terraform apply`.

Do **not** invent a second table component. Do **not** hide columns or desktop review workspace tabs. Do **not** shrink operator type below `DESIGN_TOKENS.table` (`text-[13px]`). Do **not** re-add `content-visibility` on `<tr>` with a “better” `contain-intrinsic-size`. Do **not** virtualize native `<table>` with react-window / `position: absolute` rows. Scale-table virtualization (design-system kind) is **out of this wave** unless it avoids table-row + content-visibility entirely — default is **remove the broken optimization**.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **IE-UX-01** | Drift workbench at `/governance/infrastructure/drift` | **Keep** behavior. Fix layout only |
| **TB-117 / TB-1646** | `EnterpriseTable` + `StatusTag` inventory | **Keep** the dialect |
| **Perf wave 8** | `content-visibility-auto` on table rows + React compiler | **Revert the table-row half.** Do not touch `next.config.ts` React compiler memoization |
| **UI_DESIGN_SYSTEM scale-table** | Sticky / virtualized very-large lists | Do not start a new virtualizer this wave |
| **IDS / IDT / IDH / IDG** | Inventory diagrams | Unrelated. Do not open those chats |

## Run order

**01 → 02 → 03 → 04.**

- **01** is the layout fix (token + CSS). Must land first. Fixes every `EnterpriseTable`, not only drift.
- **02** is drift-page density after rows have real boxes. May start after 01 is on the branch (or after 01 merges).
- **03** source ratchet. After 01 (asserts the 01 shape). May parallel 02.
- **04** last: Playwright on the owner-shape drift table.

Suggested Cloud Agent branch per prompt: `cursor/drift-table-layout-<short-name>-ce93`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/drift-table-layout-prompts-ce93`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `drift-table-layout-01-remove-content-visibility-from-table-rows.md` | `content-visibility: auto` on `<tr>` collapses column measure and overlaps paint |
| 02 | `drift-table-layout-02-restore-readable-row-density.md` | After 01, cells still wrap unreadably or header scrolls away on 100 rows |
| 03 | `drift-table-layout-03-token-ratchet.md` | Perf wave 8 can be re-copied onto `table.row` |
| 04 | `drift-table-layout-04-drift-workbench-overlap-ratchet.md` | No browser proof the owner screenshot cannot return |

## Open questions for the owner (defaults apply if unanswered)

1. **Perf leftover.** IE-DT-01 default: delete `content-visibility` from table rows and leave list/card virtualization alone. If a later scale-table is needed for audit, that is a **new** wave with a non-`<tr>` virtualizer. OK?
2. **Sticky header.** IE-DT-02 default: `thead` sticky inside `DESIGN_TOKENS.table.shell` (`overflow-x-auto`) so Resource / Change / Risk stay visible while scrolling 100 rows. OK?
3. **Page size.** Keep `CHANGES_PAGE_SIZE = 100` + Load more. Do not drop to 20 to hide the layout bug.

## After each prompt

Summarize: files changed, tests run, whether `/governance/infrastructure/drift` with a populated diff shows **discrete Carbon rows, 13px type, non-overlapping boxes, sortable headers visible**, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused Vitest / Playwright named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
