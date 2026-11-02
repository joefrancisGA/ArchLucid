# SN-MKT-13 — Link the two public pages to each other

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

`/why-securenow` links to `/securenow-sample`, and `/securenow-sample` links to `/why-securenow`. Both links sit in the page body. The welcome page, the marketing footer, and the operator sidebar stay unchanged. This is the move from Marketability **67** to **68**.

## Why

On a SecureNow host, `(marketing)/layout.tsx` renders these two routes without `MarketingPublicHeader` and without `MarketingPublicFooter`. A visitor who opens one page cannot reach the other. ArchLucid’s comparable marketability score is **68** because `/why` is reachable from the public site. These two in-page links are the SecureNow equivalent that the hold file allows. Welcome and footer links stay forbidden until the owner lifts that stop.

## Read first

- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.test.tsx`
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`
- `archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.tsx`
- `archlucid-ui/src/app/(marketing)/securenow-sample/SecureNowSampleView.test.tsx`
- `scripts/ci/check_securenow_marketability.py`
- `scripts/ci/test_check_securenow_marketability.py`
- `archlucid-ui/src/app/(marketing)/layout.tsx` (do not edit it)

## What to build

1. Branch `sn-mkt/13-page-links` from current `master` after SN-MKT-12 is present. SN-MKT-12 only fixes a test. This prompt can still proceed if that test file already expects the resources-menu hrefs.
2. In `why-securenow-draft-copy.ts`, add:
   - `WHY_SECURENOW_SAMPLE_LINK_HREF = "/securenow-sample"`
   - `WHY_SECURENOW_SAMPLE_LINK_LABEL = "SecureNow sample"`
   - `WHY_SECURENOW_SAMPLE_LINK_LEAD = "One synthetic ranked path. Not a customer result."`
3. In `WhySecureNowDraftView.tsx`, render that lead and a `next/link` to `WHY_SECURENOW_SAMPLE_LINK_HREF` with the label, placed after the pilot-decision section and before the conversation mailto. Do not change the pitch, the six steps, the five refusals, the status line, or the mailto.
4. In `securenow-sample-copy.ts`, add:
   - `SECURENOW_SAMPLE_WHY_LINK_HREF = "/why-securenow"`
   - `SECURENOW_SAMPLE_WHY_LINK_LABEL = "Why SecureNow"`
   - `SECURENOW_SAMPLE_WHY_LINK_LEAD = "Who it is for, the six-step workflow, and the refusals."`
5. In `SecureNowSampleView.tsx`, render that lead and a `next/link` with the label, placed after the beats and before the conversation mailto. Do not change the three existing beats, the fixture line, the pitch, the status line, or the mailto.
6. Extend `check_securenow_marketability.py` so `validate` fails when `WhySecureNowDraftView.tsx` lacks `href="/securenow-sample"`, or `SecureNowSampleView.tsx` lacks `href="/why-securenow"`. Add both view files to `TRACKED_PATHS` in `test_check_securenow_marketability.py`. Keep `continue-on-error: true`.
7. Do not add either href to the welcome page, `MarketingPublicFooter`, `MarketingResourcesMenu` beyond the links already shipped, or the operator sidebar.

## Tests

Extend `WhySecureNowDraftView.test.tsx` so a link named `SecureNow sample` has `href="/securenow-sample"`.

Extend `SecureNowSampleView.test.tsx` so a link named `Why SecureNow` has `href="/why-securenow"`.

From `archlucid-ui`:

`npx vitest run src/app/(marketing)/why-securenow/WhySecureNowDraftView.test.tsx src/app/(marketing)/securenow-sample/SecureNowSampleView.test.tsx`

From the repo root:

`python3 scripts/ci/check_securenow_marketability.py`

`python3 -m unittest scripts.ci.test_check_securenow_marketability`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not render `MarketingPublicHeader` or `MarketingPublicFooter` on the security-shell path.
- Do not add a fourth sample beat. That is SN-MKT-14.
- No price, no signup, no "Start trial", no beta GO, and no checked owner checklist box.
- Do not commit.

## Done when

Each public page links to the other in the body, the warn-only checker requires those two hrefs, and the welcome page and marketing footer still omit them.
