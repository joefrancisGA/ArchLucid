> **Scope:** QR-35 full `ci.yml` matrix honesty note. Internal engineering — not buyer-facing.

# CI.yml matrix triage (2026-09-10)

**Prompt:** QR-35 (`docs/architecture/V11_QUALITY_ROI_COMPOSER_PROMPTS.md`).

**Inspected trunk SHA:** `05fc22c3aa` (`master` after QR-34 merge).

**Baseline full dispatch:** GitHub Actions run [33193938737](https://github.com/joefrancisGA/ArchLucid/actions/runs/33193938737) on `master` @ `eb42295f7425355644e37b50a09fbd93c2c68bb5` (`workflow_dispatch`, 2026-08-28). Workflow conclusion: **failure**. No newer completed `workflow_dispatch` on `master` as of this note.

**Fresh dispatch:** `gh workflow run ci.yml --ref master` returns **HTTP 403** (cloud agent token cannot dispatch). Owner must re-run the full matrix from Actions after this PR merges.

**claimBoundary:** Required contexts remain the five checks in [`.github/rulesets/golden-cohort-gate-required-check.json`](../../.github/rulesets/golden-cohort-gate-required-check.json). This document does **not** expand branch protection. Jobs marked warn-only in `ci.yml` may show red without blocking merge.

## Local verification (2026-09-10 @ `05fc22c3aa` + QR-35 fixes)

| Guard / job lane | Aug-28 run | Local 2026-09-10 | Notes |
| --- | --- | --- | --- |
| `CI: guards pre-corset (text)` | failure | **pass** after QR-35 fixes | Was red on audit marker drift, OpenAPI→matrix doc gap, missing R379 rollback |
| `Docs: markdown link integrity` (relative links) | failure | **pass** (`check_md_links.py`) | Fixed WAVE81→WAVE82 stub link + QR-13 triage doc `.github/` paths |
| `Azure extractor: Get-ArchLucidAzurePackage Pester` | success (Aug-28) | **not run** | `pwsh` unavailable in cloud agent VM — retest on next owner dispatch |
| `.NET: OpenAPI v1 contract snapshot` | failure | not re-run locally | Hold until owner dispatch on post-merge trunk |
| `.NET: fast core (corset)` | failure (skipped fan-in) | not re-run locally | Hold until owner dispatch |
| `Operator UI: lint, typecheck, production build` | failure | not re-run locally | Known TS 7 / eslint peer gap from QR-13 note — owner backlog |

## Fixes in QR-35 branch

1. **`docs/library/AUDIT_COVERAGE_MATRIX.md`** — bump `<!-- audit-core-const-count:433 -->`; document `DELETE /v1/findings/{findingId}/mute` (wave 76 unmute) in narrative + appendix.
2. **`ArchLucid.Persistence/Migrations/Rollback/R379_FindingSemanticSupportBandOverlays.sql`** — rollback companion for migration 379 (AS-060 overlay table).
3. **`ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`** — regenerated so unified schema snapshot includes migration 379.
4. **ConfigureAwait guard** — remove `.ConfigureAwait(false)` from four test-project call sites flagged by `check_test_configure_await.py`.
5. **`docs/library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE81.md`** — remove broken link to not-yet-created WAVE82 doc.
6. **`docs/quality/ci-yml-matrix-triage-2026-09-09.md`** — fix relative links to `.github/` (`../../` not `../`).

## Aug-28 failed jobs — still held (not fixed in QR-35)

| Job | Why held | Suggested owner action |
| --- | --- | --- |
| Full `workflow_dispatch` matrix | Stale since 2026-08-28; dispatch blocked for agent | Actions → CI → Run workflow on `master` after QR-35 merges |
| `Operator UI: lint, typecheck, production build` | `typescript@7` vs `eslint-config-next` peer range | Upgrade eslint/typescript-eslint when TS 7 supported, or pin TS 5.x |
| `Docs: markdown link integrity` (terminology guard) | Buyer copy guard `"review package"` in operator UI tests | Product copy migration or guard allowlist (see QR-13 note) |
| `Containers: Docker build smoke` / Playwright / axe / Lighthouse | Downstream of UI lint/typecheck on Aug-28 run | Retest after owner full-matrix dispatch |

## Regenerate this note

```bash
gh run list --workflow ci.yml --branch master --limit 8
gh run view <run-id> --json jobs --jq '.jobs[] | {name, conclusion}'
bash scripts/ci/run_guards_pre_corset.sh
python3 scripts/ci/check_md_links.py
bash scripts/ci/assert_api_types_in_sync.sh
```
