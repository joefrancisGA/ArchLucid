# V13-02 — Audit matrix: share mutation path templates match OpenAPI

**One prompt per chat.** Branch: `cursor/v13-02-audit-matrix-share-paths-97a4`. Model: **Composer 2.5 slow**.

**Skip if already green:** `#2829` merged to `origin/master` on 2026-09-10 (`a5b22cc5db`). Run the assert first. If it exits **0**, **do not open a PR** — V13-02 is done; the next rescore already owns the +0.20 `(A)`.

---

## Goal

Make `python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py` **exit 0**. At the v13 freeze, two share rows in `docs/library/AUDIT_COVERAGE_MATRIX.md` documented `{actorOid}` while OpenAPI is `PUT /api/v1/architectures/{architectureId}/shares` and `DELETE .../shares/{targetActorOid}`. **#2829 already applied that fix on trunk.** This prompt is a re-check, not a second rewrite.

## Why this is second (token ROI)

v13 scored GRI **92** and Runtime **68** with this assert red. **#2829 is on `origin/master`.** If the assert is green, skip — the next rescore already owns **GRI 92→93** and **Runtime +1** after 01 (**(A) +0.20**). If trunk is red again, it is still a two-line docs change. See `docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`.

## Context

- Assessment: `docs/assessments/LATEST_GPT55.md` (v13) §6, §14.
- Canonical OpenAPI: `archlucid-ui/lib/api/generated/schema.ts`.
- **#2829 is MERGED.** Confirm with the assert. Only edit the matrix if trunk is red again (later OpenAPI churn).

## What to build

1. Run `python3 scripts/ci/assert_openapi_mutations_in_audit_matrix.py`. If exit **0**, stop. Do not open a PR.
2. If red, open `docs/library/AUDIT_COVERAGE_MATRIX.md` and replace leftover `{actorOid}` share rows with:
   - `PUT /api/v1/architectures/{architectureId}/shares`
   - `DELETE /api/v1/architectures/{architectureId}/shares/{targetActorOid}`
3. Re-run the assert — must exit **0**.
4. Do **not** change `SqlArchitectureShareRepository` (wave 22 / #2804 already on master).

## Acceptance

- Assert script exit **0**.
- Commit + PR. Do not push `master`.

## Constraints

- **Do not** add engines, golden fixtures, or UI.
- **Do not** implement V13-01 or V13-03 in this PR.
- No `git add -A`.
