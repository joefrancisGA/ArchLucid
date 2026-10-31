# SN-STICK-03 — SecureNow return-reason operator page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-STICK prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`

## Goal

An operator page explains the four return reasons and links to the same four destinations as Home. The page is preparation, not a scheduler.

## Why

Home links are short. An operator still needs one place that says when each reason applies and what the page refuses to do.

## Read first

- `docs/securenow/RETURN_REASONS.md`
- `archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx` (pattern only; do not change it)
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/page.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-accessibility/SecureNowAccessibilityPageView.test.tsx` (test shape only)

## What to build

1. Branch `sn-stick/03-operator-page` from current `master` after SN-STICK-02 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-return-reasons-copy.ts` with:
   - Heading `When to come back`.
   - Lead `Use the existing work queues. Do not wait for a reminder. SecureNow beta remains NO_GO.`
   - The same four reasons and hrefs as `securenow-return-home-copy.ts`. Import the row constant from that file instead of copying the hrefs into a second list.
   - Guardrail `This page does not send a reminder, score engagement, or schedule a capture.`
3. Add `archlucid-ui/src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx`. `data-testid` is `securenow-return-reasons-page`. Render the four reasons as links. Use `OperatorPageContainer` and `OperatorPageHeader`.
4. Add `page.tsx` with metadata title `When to come back`.
5. Add `SecureNowReturnReasonsPageView.test.tsx`. Assert the heading, all four hrefs, `NO_GO`, and `does not send a reminder`. Assert that the rendered text does not contain `$` or `engagement score`.
6. Add one Home row to `securenow-return-home-copy.ts` only if it does not already link `/administration/securenow-return-reasons`. Do not add a fifth reason. If a fifth row would be required to link this page, instead add the link from the operator page back to `/` with the label `Back to Home`. Do not add a fifth Home row.

## Tests

```bash
cd archlucid-ui
npm run test:run -- src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.test.tsx src/lib/product-line/securenow-return-home-copy.test.ts
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add email, cron, a preference API, or a sidebar item.
- Do not edit the pilot-decision page.
- Do not commit.

## Done when

`/administration/securenow-return-reasons` renders the four existing destinations and states that it does not send a reminder.
