# IE-DT-04 — Playwright: drift change rows must not overlap

**Wave:** drift-table-layout (**IE-DT**). **Depends on:** IE-DT-01, IE-DT-02. **Do not** re-implement 01–03.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A mock Playwright spec must fail if the Drift & snapshots change table returns to the owner screenshot: overlapping row boxes or type smaller than the operator 13px table cell.

## Why

IE-DT-01/02/03 are source and unit tests. The owner bug is **painted layout**. jsdom does not compute table column widths. Only a browser can catch `content-visibility` on `<tr>` collapsing measure again.

## Context

- `archlucid-ui/e2e/infra-evidence-hub-handoff.mock.spec.ts` — already opens `/governance/infrastructure/drift` with snapshot/diff fixtures (`infra-drift-diff-picker`, `diff-1`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx` — `data-testid="infra-drift-change-row-${changeId}"`
- `archlucid-ui/e2e/ux-audit-route-registry.ts` — do not couple this spec into merge-blocking operator-shell CI unless the file already runs in `test:e2e:mock:operator-shell`. Prefer the same mock Playwright job that already runs infra-evidence hub handoff.
- Playwright `locator.boundingBox()`; `getComputedStyle` via `evaluate`

## What to build

1. Add `archlucid-ui/e2e/infra-drift-table-layout.mock.spec.ts` (or a focused `test.describe` in the existing hub-handoff spec **only if** that file is already the mock-operator-shell target — prefer a **new** file so 01–03 reviewers do not own e2e).
2. Fixture: enough semantic change rows that the table is visibly populated (≥8 rows). Reuse existing infra-evidence mock handlers / snapshot+diff IDs from hub-handoff. Do not call live Azure.
3. Assertions (all must fail on pre-IE-DT-01 `content-visibility` table rows, pass after 01–02):
   - `getByRole('table', { name: 'Inventory drift changes' })` is visible.
   - Collect `tr` in `tbody` (exclude empty-state colspan row). `count >= 8`.
   - Each body row `boundingBox()` has `height >= 36` (cell `py-3` + 13px line).
   - For every pair of successive body rows, `a.y + a.height <= b.y + 1` (allow 1px subpixel). No overlapping Y ranges.
   - `getComputedStyle` on the first body `td`: `parseFloat(fontSize) >= 13`.
   - The first body `td` text is not a single-character-per-line wrap: `clientWidth >= 80` on the Resource name cell (or the row’s first cell).
4. Tag the spec so it runs with the existing mock Playwright suite (`@release-gate` only if hub-handoff already uses that tag; otherwise match hub-handoff’s project). Do **not** add `testIgnore` exceptions. Do not hook UX-audit screenshot capture.
5. If the mock cannot seed ≥8 changes without new fixture JSON, extend the **existing** infra-evidence mock in the smallest way (repeat change ids with distinct `changeId`s). Do not invent a second API.

## Acceptance criteria

- Spec fails on a temporary revert of IE-DT-01 (`content-visibility-auto` back on `table.row`) — prove this once locally by toggling the class, then restore 01. Mention that probe in the PR.
- Spec passes on IE-DT-01+02.
- No live inventory. No `terraform apply`.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** change tokens except if a Playwright locator requires a stable `data-testid` on `tbody` — adding `data-testid="infra-drift-changes-body"` on `EnterpriseTableBody` in the drift page is allowed.
- **Do not** hide desktop review workspace tabs.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Verification: from `archlucid-ui/`, run the **scoped** Playwright mock file the repo already uses for hub-handoff (copy the npm script from `package.json` / that spec’s header). Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if the run exceeds 15s. No full `npm run test:e2e` of every project.
