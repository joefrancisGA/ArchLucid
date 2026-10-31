# SN-SELF-04 — Checker for SecureNow self-service notes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

CI warns when the stuck-state note, the Home section, the operator page, or the security-shell catalog assignment drifts. The checker stays warn-only. It still requires `/administration/support` to stay off the security product line.

## Why

SN-SELF-01 through SN-SELF-03 are easy to regress into a support SLA, a public price, or by opening the ArchLucid support bundle on SecureNow.

## Read first

- `docs/securenow/SELF_SERVICE.md`
- `archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `scripts/ci/check_securenow_adoption_friction.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow adoption friction`)

## What to build

1. Branch `sn-self/04-checker` from current `master` after SN-SELF-01 through SN-SELF-03 are present.
2. Add `scripts/ci/check_securenow_self_service.py`.
3. The script exits 1 when any of these fail:
   - `docs/securenow/SELF_SERVICE.md` lacks `**Scope:**`, `NO_GO`, `Collection missing or stale`, `Connector will not finish`, `No ranked path, or not verified`, `Still stuck`, `/integrations/cloud-connections`, `/administration/connection-status`, `/security/remediation-factory`, `/security/remediation-instances`, or `mailto:support@archlucid.net?subject=SecureNow`.
   - That file contains `$` or `Start trial`.
   - `securenow-self-service-home-copy.ts` lacks `When you are stuck`, `NO_GO`, and `/administration/securenow-self-service`.
   - That file contains `recommendedFirst: true`.
   - `securenow-self-service-copy.ts` lacks the four situation titles and the mailto.
   - `SecureNowSelfServicePageView.tsx` lacks `securenow-self-service-page`.
   - `product-line-catalog.ts` lacks `"/administration/securenow-self-service": "security"`.
   - `product-line-catalog.ts` lacks `"/administration/support": "architecture"`.
4. Add `scripts/ci/test_check_securenow_self_service.py`. The real tree passes. A temp copy with `$` in `SELF_SERVICE.md` fails. A temp copy that changes the support catalog assignment away from `architecture` fails.
5. In `.github/workflows/ci.yml`, add two steps after `SecureNow adoption friction unit tests`, both `continue-on-error: true`:
   - `SecureNow self-service` runs `python scripts/ci/check_securenow_self_service.py`.
   - `SecureNow self-service unit tests` runs `python -m unittest scripts.ci.test_check_securenow_self_service`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_self_service.py`

`python3 -m unittest scripts.ci.test_check_securenow_self_service`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The checker passes on the tree that contains the note, the Home section, the operator page, and the architecture-only support route, and it fails when the note contains `$` or when `/administration/support` is no longer architecture-only.
