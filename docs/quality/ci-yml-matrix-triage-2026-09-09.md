> **Scope:** QR-13 full `ci.yml` matrix honesty note. Internal engineering — not buyer-facing.

# CI.yml matrix triage (2026-09-09)

**Prompt:** QR-13 (`docs/architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md`).

**Baseline full dispatch:** GitHub Actions run [33193938737](https://github.com/joefrancisGA/ArchLucid/actions/runs/33193938737) on `master` @ `eb42295f7425355644e37b50a09fbd93c2c68bb5` (`workflow_dispatch`, 2026-08-28). Workflow conclusion: **failure**. No newer completed `workflow_dispatch` on `master` as of this note.

**Local verification:** `origin/master` @ `1528a33e89` (2026-09-09) plus QR-13 fixes on branch `cursor/qr-13-ci-yml-matrix-triage-97a4`.

**claimBoundary:** Required contexts remain the five checks in [`.github/rulesets/golden-cohort-gate-required-check.json`](../.github/rulesets/golden-cohort-gate-required-check.json). This document does **not** expand branch protection. Jobs marked warn-only in `ci.yml` may show red without blocking merge.

## Required checks (golden cohort)

| Check | Aug-28 run | Local 2026-09-09 | Notes |
| --- | --- | --- | --- |
| `Security: gitleaks (secret scan)` | success | pass (script present) | — |
| `.NET: fast core (corset)` | failure | **pass** (`Suite=Core`, 416 tests, excludes Slow/Integration/Record) | Aug-28 failed because `dotnet-fast-core-build` was **skipped** after upstream red jobs |
| `Operator UI: typecheck (blocking)` | failure | **pass** after duplicate-import fix | Was blocked by duplicate `useProductionEvalChrome` import in `PackagePrintPageView.tsx` |
| `CI: beta-readiness wiring guards` | not in Aug-28 run name list | on `ui-typecheck-on-push.yml` push path | Live ruleset may still lag JSON — see [BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md) |
| `cohort-real-llm-gate` | not exercised | repo var gated | — |

## Fixes in QR-13 branch

1. **`PackagePrintPageView.tsx`** — remove duplicate `useProductionEvalChrome` import (unblocks typecheck, Docker build, Playwright mock, Lighthouse, axe mock).
2. **`docs/architecture/ui_route_traffic_estimates.template.md`** — add `/help/governance-infrastructure-drift` so `assert_ui_route_traffic_workbook_canonical` passes in `CI: guards pre-corset (text)`.

## Aug-28 failed jobs — root cause and status

| Job | Aug-28 cause (one line) | 2026-09-09 status |
| --- | --- | --- |
| `.NET: fast core (corset)` | Fan-in skipped after upstream failures (`dotnet-fast-core-build:skipped`) | **Green locally** (corset filter) |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | Generated api-types out of sync with OpenAPI snapshot | **Green locally** (`assert_api_types_in_sync.sh`) |
| `CI: guards pre-corset (text)` | `assert_route_tier_policy_nav` missing `OperationalErrorsAdminController` registry row | **Green locally**; workbook drift fixed in QR-13 |
| `Operator UI: typecheck (blocking)` | Duplicate import + stale TS errors in operator UI | **Fixed** in QR-13 (duplicate import) |
| `Operator UI: lint, typecheck, production build` | ESLint: `typescript-eslint does not support TS 7.0` | **Still red** — dependency gap (see backlog) |
| `Operator UI: Playwright mock functional (mock API)` | Blocked by typecheck/build | **Retest after merge** (typecheck fixed) |
| `Operator UI: axe-core WCAG 2.1 A/AA (mock)` | Blocked by typecheck | **Retest after merge** |
| `Operator UI: Lighthouse CI synthetic checks (lab)` | Blocked by typecheck | **Retest after merge** |
| `Containers: Docker build smoke` | `next build` typecheck failure (same TS errors) | **Retest after merge** |
| `Docs: markdown link integrity` | `review-terminology-guard.test.ts` — forbidden `"review package"` copy | **Still red** locally (warn-only job) |

## Known-red backlog (owner-visible, not path-skipped)

| Job | Why still red | Suggested owner action |
| --- | --- | --- |
| `Operator UI: lint, typecheck, production build` | `typescript@7` vs `eslint-config-next` / `typescript-eslint` peer range | Upgrade eslint/typescript-eslint stack when TS 7 support ships, or pin TypeScript 5.x until then |
| `Docs: markdown link integrity` | Buyer copy guard: `"review package"` terminology across operator UI | Batch copy migration or narrow guard allowlist with product sign-off (`review-terminology-guard.test.ts`) |
| Full `workflow_dispatch` matrix | Not re-run on trunk since 2026-08-28 | Owner: Actions → CI → Run workflow on `master` after QR-13 merges to measure Docker / Playwright / Tier 2 |

## Aug-28 matrix summary

| Conclusion | Count |
| --- | ---: |
| success | 38 |
| failure | 10 |
| cancelled | 1 |
| skipped | 28 |

Cancelled: `Operator UI: unit (Vitest)` (workflow cancel cascade). Skipped: Tier 2+ jobs because corset fan-in never completed on that dispatch.

## Regenerate this note

```bash
gh run list --workflow ci.yml --branch master --limit 8
gh run view <run-id> --json jobs --jq '.jobs[] | {name, conclusion}'
bash scripts/ci/run_guards_pre_corset.sh
bash scripts/ci/assert_api_types_in_sync.sh
cd archlucid-ui && npm run typecheck
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj \
  --filter "Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord"
```
