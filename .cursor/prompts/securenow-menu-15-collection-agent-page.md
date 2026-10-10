# SN-COL-03 — Collection agent page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-COL-02 and SN-MENU-01.

## Goal

A read-only **Collection agent** page, first under Data sources, that tells a security architect whether collection is healthy: the last successful run, the last run of any kind, recent runs, and what failed.

## Read first

- `GET /v1/collection-runs` from SN-COL-02 and its generated UI types
- The SN-MENU-01 Data sources group and the SN-MENU-02 label map
- `archlucid-ui/src/app/(operator)/administration/connection-status/` for an existing status layout to reuse
- `archlucid-ui/src/components/ui/status-tag.tsx`, `enterprise-table.tsx`
- `archlucid-ui/src/lib/product-line/product-line-path-access.ts`
- `docs/library/UI_DESIGN_SYSTEM.md`

## What to build

- Route `/infrastructure/collection-agent`, assigned to the `security` product line only.
- Sidebar: first link under Data sources, label `Collection agent`, tooltip `Whether scheduled collection is running and what it found.`
- Header line: last successful run as relative time with a `StatusTag`: `Ready` if within the expected interval, `Needs attention` if older or the last run failed, `Blocked` if there has never been a successful run.
- Recent runs in an `EnterpriseTable`: started, duration, status, subscriptions covered, and resulting snapshot (linking to Changes & drift for that snapshot).
- A run row expands to show the error summary for failed or rejected runs.
- Empty state: `No collection runs yet.` with links to the agent setup help topic and to `Manual upload`.
- A failed load shows the API reason. It does not render an empty table.

Do not add Run now in this session. SN-COL-04 adds it.

SN-MENU-04's Last collection tile links here once this page exists.

## Tests

1. The sidebar lists `Collection agent` first under Data sources in the SecureNow shell, and not in the Architecture shell.
2. The status tag is `Ready`, `Needs attention`, or `Blocked` per the rule above.
3. A failed run expands to its error summary.
4. Empty and failed-load states render as described.
5. The route is blocked in the Architecture shell.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- No new API in this session.
- Do not commit.

## Done when

A security architect can open Collection agent and see whether collection is healthy, when it last succeeded, and why a recent run failed.
