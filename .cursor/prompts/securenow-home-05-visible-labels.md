# SN-HOME-05 — Sidebar labels wrap, and SecureNow titles match

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

## Goal

The full sidebar label is visible, including "Ask about your environment". On the SecureNow shell, the page title and breadcrumb use that same label.

## Why

`SidebarNavLink` puts `truncate` on the label, so "Ask about your environment" renders as "Ask about your environme…". SecureNow nav labels and page titles diverge: the sidebar says "Resources" and "Ask about your environment", while page titles still come from `OPERATOR_NAV_LINK_LABELS` ("Resource explorer", "Ask"). Shortening the sidebar label back to "Ask" would undo the menu label. Wrapping keeps the name.

## Read first

- `archlucid-ui/src/components/sidebar-nav/SidebarNavLink.tsx`
- `archlucid-ui/src/components/sidebar-nav/SidebarNavLink.test.tsx`
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`
- `archlucid-ui/src/lib/route-static-titles.ts`
- `archlucid-ui/src/lib/i18n.ts` (`OPERATOR_NAV_LINK_LABELS`)
- `archlucid-ui/src/lib/product-line/filter-nav-groups-for-product-line.test.ts`

## What to build

1. Branch `sn-home/05-visible-labels` from current `master`.
2. In `SidebarNavLink`, the label span wraps onto a second line (`min-w-0 whitespace-normal break-words`) instead of `truncate`. The icon stays `shrink-0`. One or two lines is enough. Do not shrink the type below `OPERATOR_TYPOGRAPHY.navLabel`.
3. Group headings may keep their current truncation. This prompt is the link label.
4. When the product line is security, the visible page title and breadcrumb for every href in `SECURENOW_NAV_LABELS` use that label. Routes that stay on `OPERATOR_NAV_LINK_LABELS` today include `/infrastructure/resources` ("Resource explorer"), `/infrastructure/ask` ("Ask"), `/security/assigned-to-me` ("Assigned to me"), and `/security/remediation-instances` ("Remediation instances"). Match the sidebar for those and for the other hrefs in the map.
5. When the product line is architecture, titles stay on `OPERATOR_NAV_LINK_LABELS`. "Resource explorer" remains the Architecture title.
6. Do not change hrefs. Do not rename `SECURENOW_NAV_LABELS["/infrastructure/ask"]`. It stays "Ask about your environment".

## Tests

1. A sidebar link whose label is "Ask about your environment" renders that full string, and the label span does not have `truncate`.
2. SecureNow page title for `/infrastructure/resources` is "Resources".
3. SecureNow page title for `/infrastructure/ask` is "Ask about your environment".
4. Architecture title for the resource explorer route remains "Resource explorer".
5. `filter-nav-groups-for-product-line.test.ts` still expects "Ask about your environment".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new route, no new package.
- Sentence case. Do not re-case labels with CSS.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

Sidebar link labels wrap, and SecureNow titles match `SECURENOW_NAV_LABELS` while Architecture titles stay as they are.
