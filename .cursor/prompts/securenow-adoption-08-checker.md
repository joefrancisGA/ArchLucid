# SN-ADOPT-08 — Extend the adoption checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ADOPT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`

## Goal

The existing warn-only adoption checker guards the Path inspect wording, the five Start here rows, and the empty-collection link text. It stays warn-only.

## Why

SN-ADOPT-05 through SN-ADOPT-07 are easy to regress into two factory links, a shared Home href, or a first hour that claims a timed result.

## Read first

- `scripts/ci/check_securenow_adoption_friction.py`
- `scripts/ci/test_check_securenow_adoption_friction.py`
- `docs/securenow/FIRST_HOUR.md`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `.github/workflows/ci.yml` (steps `SecureNow adoption friction` and `SecureNow adoption friction unit tests`)

## What to build

1. Branch `sn-adopt/08-checker` from current `master` after SN-ADOPT-05 through SN-ADOPT-07 are present.
2. Extend `scripts/ci/check_securenow_adoption_friction.py`. Keep the current `FIRST_HOUR.md` tokens, the operator-copy tokens, the page test id, the catalog assignment, the dollar check, and the forbidden-phrase list. In the home-copy token list, replace `First hour path` with `First hour page`. Do not require `First hour path` after SN-ADOPT-06. Add `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx` to the files the checker reads, and add that path to `TRACKED_PATHS` in the unittest. Add failures when:
   - `FIRST_HOUR.md` lacks `Path inspect` or `Select a priority row`.
   - `securenow-first-hour-copy.ts` lacks `Path inspect` or `Select a priority row`.
   - That operator copy gives step 3 the same factory href as step 2. Treat `SECURENOW_REMEDIATION_FACTORY_PATH` or `"/security/remediation-factory"` on the step 3 object as a failure.
   - `SecureNowFirstHourPageView.tsx` lacks `id="path-inspect"` or `id="stop"`.
   - `securenow-first-hour-home-copy.ts` lacks `A missing or stale capture is the current step` or `A blank ranking is not a clean result`.
   - Its row data does not contain exactly these five label-to-href pairs in order: `Scope and freshness` → `/integrations/cloud-connections`; `One ranked path` → `/security/remediation-factory`; `Path inspect` → `/administration/securenow-first-hour#path-inspect`; `Stop` → `/administration/securenow-first-hour#stop`; `First hour page` → `/administration/securenow-first-hour`. Validate the actual row assignments and five distinct href values, not independent source-token presence or URL substrings. Add mutation tests that swap two row hrefs and duplicate a row href while leaving URL constants intact; both must fail.
   - `SecureNowHomeEnvironmentContext.tsx` lacks `No collection yet` or `/integrations/cloud-connections`.
3. Extend `scripts/ci/test_check_securenow_adoption_friction.py`. The real tree passes. A temp copy that deletes `Path inspect` from `FIRST_HOUR.md` fails. A temp copy that deletes `No collection yet` from the environment component fails.
4. Leave the existing CI steps in place. Do not add a second workflow job. Both steps stay `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_adoption_friction.py`

`python3 -m unittest scripts.ci.test_check_securenow_adoption_friction`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The checker passes on the tree with the Path inspect wording, the five Home rows, and `No collection yet`, and it fails when `Path inspect` or `No collection yet` is removed.
