# SN-ROI-07 — Investigation-effort operator page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home links to `/administration/securenow-investigation-effort`. That page points at the blank measurement log, the cost card, the fixture worksheet, and the send rule. It does not start a timer or calculate a result.

## Why

The ROI notes are easy to miss. Sponsors already have a Home section. One more row should open a page that names the four documents. The security product line allows the route. The architecture product line does not.

## Read first

- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/ROI_COST_INPUT.md`
- `docs/securenow/ROI_FIXTURE_WORKSHEET.md`
- `docs/securenow/ROI_SEND_RULE.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx` (page shell)
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.test.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.test.ts`

## What to build

1. Branch `sn-roi/07-operator-page` from current `master` after SN-ROI-06 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts`:
   - Heading: `Investigation effort`.
   - Lead: `Record comparable minutes in the pilot measurement log. Share a number only when the send rule passes. SecureNow beta remains NO_GO.`
   - Guardrail: `This page does not start a timer, calculate ROI, or copy a fee.`
   - Four notes, in this order, with these labels and hrefs. The href is the repository path. Do not invent an App Router route for a markdown file.
     - `Pilot measurement log` → `docs/securenow/PILOT_MEASUREMENT_LOG.md`
     - `Cost input` → `docs/securenow/ROI_COST_INPUT.md`
     - `Fixture worksheet` → `docs/securenow/ROI_FIXTURE_WORKSHEET.md`
     - `Send rule` → `docs/securenow/ROI_SEND_RULE.md`
3. Add `page.tsx` and `SecureNowInvestigationEffortPageView.tsx` under `archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/`.
   - `data-testid="securenow-investigation-effort-page"`.
   - Follow the first-hour shell: `OperatorPageContainer` and `OperatorPageHeader`.
   - Render each note as a plain `<a>` with `OPERATOR_LINK.inline` and the visible label above. Do not use `next/link` for those four hrefs.
4. In `PRODUCT_LINE_EXTRA_ASSIGNMENTS`, set `"/administration/securenow-investigation-effort": "security"`.
5. Extend `product-line-catalog.test.ts`: the path is allowed for `security` and refused for `architecture`.
6. Append one row to `SECURENOW_SPONSOR_HOME_ROWS`. Keep every existing row and its order, including a Decision cycle row if one is already present. Do not set `recommendedFirst`.
   - `href`: `/administration/securenow-investigation-effort`
   - `label`: `Investigation effort`
   - `summary`: `Record comparable minutes and read the send rule before a number leaves the room.`
7. Update `securenow-sponsor-home-copy.test.ts` so the length is one greater than before this row, and the last row’s href is the new path.

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-sponsor-home-copy.test.ts 'src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.test.tsx' src/lib/product-line/product-line-catalog.test.ts`

The page test finds `securenow-investigation-effort-page`, the four link labels, and those four hrefs. The rendered text contains `NO_GO` and does not contain `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a clock, a form post, an API, or a sponsor export.
- Do not add a sidebar or header item.
- Do not hide a workspace tab behind More.
- Do not commit.

## Done when

Sponsor Home has an Investigation effort row, and the security product line can open a page that links the four ROI notes without calculating a result.
