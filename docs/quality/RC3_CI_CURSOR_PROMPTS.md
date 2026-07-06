> **Archived (2026-07-05):** Historical **RC3** prompts only. Active release-candidate work uses branch **`RC7`** and [`docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md`](../runbooks/STAGING_DEPLOYMENT_VALIDATION.md).
>
> **Scope:** Cursor agent copy-paste prompts for **RC3** CI / release-gate remediation after run [28443661305](https://github.com/joefrancisGA/ArchLucid/actions/runs/28443661305). Not a substitute for [`docs/library/TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md) or workflow YAML as source of truth.

# RC3 CI — Cursor prompts (2026-06-30)

**Branch:** `RC3`  
**Worktree:** `C:\ArchLucid\ArchLucid-RC3`  
**Baseline CI run:** [28443661305](https://github.com/joefrancisGA/ArchLucid/actions/runs/28443661305) (after `de102fc7d`)

## Flaw map (baseline run)

| Job | Result | Root cause | Blocking? |
|-----|--------|------------|-----------|
| **CI: guards pre-corset (text)** | failure | Control-flow spacing in `ArchitectureAnalysisService.cs` | Warn-only on RC3 (`continue-on-error` unless `RC6`) |
| **Operator UI: Playwright mock functional** | failure | `executive-roi-dashboard.spec.ts` — empty executive dashboard + missing ROI panels | **Yes** |
| **Operator UI: e2e live API + SQL** | **cancelled** | Playwright step ~112 min; job `timeout-minutes: 120` (API **did** reach `/health/ready`) | Warn-only |
| **Operator UI: live e2e (ApiKey / JWT subset)** | failure | Playwright test timeouts (180s / 240s), not API boot | Warn-only |
| **.NET: merge coverage + gates** | failure | No `coverage.cobertura.xml` in downloaded shards | Warn-only |

**Passed (notable):** `.NET: fast core`, slow shard API (~28 min), slow shard domain (~13 min).

## Implementation status

| Prompt | Title | Status | Commit |
|--------|-------|--------|--------|
| **A** | Pre-corset control-flow spacing | **Done** | `09bb9439d` |
| **B** | Executive ROI mock Playwright | **Done** | `7897fa2ef` |
| **C** | `ui-e2e-live` pass 1 (stop 2h cancel) | **Done** (uncommitted) | — |
| **D** | ApiKey/JWT live e2e boot + slow specs | Open | — |
| **E** | `ui-e2e-live` pass 3 (a11y matrix cost) | Open | — |
| **F** | Merge coverage cascade | Open | — |

## Suggested execution order

1. **A** — hygiene (done)
2. **B** — merge-blocking mock UI (done)
3. **C** — `ui-e2e-live` pass 1 (cancelled @ 120 min; API boot OK)
4. **D → E** — follow-up live e2e passes
5. **F** — when cleaner coverage signal is wanted

**RC release gate note:** `ui-e2e-live-rc` in `.github/workflows/rc-release-gate.yml` already runs `--grep @release-gate` with a **90 min** timeout. **Prompt C Option A** aligns full CI with that subset.

---

## Prompt A — Pre-corset spacing (quick win)

**Status:** Done (`09bb9439d`).

```
Branch: RC3 (worktree C:\ArchLucid\ArchLucid-RC3)

CI run 28443661305 — job "CI: guards pre-corset (text)" failed with:
  Control-flow spacing guard failed: ArchLucid.Application/Analysis/ArchitectureAnalysisService.cs
  (missing blank line before if/foreach at lines ~45, 61, 64, 72, 80, 83, 96, 101, 107, 115, 123, 128)

Fix ONLY control-flow spacing in that file per repo style (blank line before every `if` and `foreach`
that is not the first statement in its block/method). Do not change logic.

Verify locally:
  python -c "import sys; sys.path.insert(0, 'scripts/ci'); from check_control_flow_spacing import scan_file; from pathlib import Path; v = scan_file(Path('ArchLucid.Application/Analysis/ArchitectureAnalysisService.cs')); print('OK' if not v else chr(10).join(v)); sys.exit(1 if v else 0)"

Do not commit unless I ask; show diff summary when done.
```

---

## Prompt B — Executive ROI mock Playwright (merge-blocking)

**Status:** Done (`7897fa2ef`). Changes: strict 90s proxy waits, `waitForExecutiveRoiDashboardHydrated()`, 30s empty-state timeout.

```
Branch: RC3

CI 28443661305 — "Operator UI: Playwright mock functional" failed in executive-roi-dashboard.spec.ts:
  - expectExecutiveRoiExecutiveSurface: executive-dashboard-empty-state count > 0 (expected 0)
  - expectExecutiveRoiPortfolioPanels / spec line 59: exec-roi-identified-vs-realized-panel not visible

Reproduce:
  cd archlucid-ui
  npm ci && npm run build
  MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.mock.config.ts --project=chromium e2e/executive-roi-dashboard.spec.ts

Investigate end-to-end:
  - Mock path: e2e/mock-archlucid-api-server.ts → getScreenshotMockFallbackGetJson for /v1/roi/executive-summary
  - Client fetch: src/lib/fetch-executive-roi-summary-client.ts → /api/proxy/v1/roi/executive-summary
  - Portfolio empty gate: src/lib/executive-dashboard-workspace-state.ts (systemCount/latestRunCount)
  - Page: src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView.tsx
  - Helpers: e2e/helpers/executive-roi-dashboard.ts (prepareExecutiveRoiDashboardProxyWaits)

Likely failure modes:
  1) summaryResponse wait resolves null but test continues → dashboard stays empty
  2) mock JSON shape drift vs ExecutiveRoiSummary type (systemCount/latestRunCount missing/zero)
  3) proxy returns non-2xx for executive-summary on /executive/dashboard

Fix with minimal diff:
  - Prefer fixing mock/fixture or proxy wiring over weakening assertions
  - If waits are the bug, fail fast when summaryResponse is null OR await provider hydration before empty-state assertions
  - Keep @smoke / @executive-roi-dashboard tags

Verify:
  MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.mock.config.ts --project=chromium e2e/executive-roi-dashboard.spec.ts

Do not commit unless I ask.
```

---

## Prompt C — `ui-e2e-live` pass 1 (stop the 2h cancel)

**Status:** Done (Option A). `ui-e2e-live` runs `--grep @release-gate` (90 min timeout); new warn-only `ui-e2e-live-extended` runs the remainder (`--grep-invert "@release-gate|@live-a11y-full-matrix"`, 180 min). `workflow_dispatch` + `run_extended_live_a11y_matrix` applies to extended job only.

```
Branch: RC3

CI 28443661305 — job "Operator UI: e2e live API + SQL (full CI…)" was CANCELLED at timeout-minutes: 120.
Timeline from GitHub job JSON:
  - Start ArchLucid.Api: SUCCESS (~2 min to ready)
  - Playwright step: ran ~13:38 → 15:30 (~112 min) then cancelled
  - NOT an API boot failure (unlike earlier RC gate iterations)

Pass 1 scope — CI plumbing only (no product behavior changes unless required):

1) Read .github/workflows/ci.yml job ui-e2e-live (~3455–3577) and archlucid-ui/playwright.config.ts
   (workers:1, retries:1 in CI, testMatch includes 35+ live-api-*.spec.ts + demo smokes + marketing + huge live-api-accessibility route matrix).

2) Implement ONE of these strategies (pick the smallest diff that fits; document trade-off in commit message):

   **Option A (recommended pass 1):** Split scope in CI
   - ui-e2e-live runs ONLY @release-gate tagged specs (same as rc-release-gate.yml ui-e2e-live-rc):
       npx playwright test --grep @release-gate --grep-invert "@live-a11y-full-matrix"
   - Add NEW warn-only job ui-e2e-live-extended (or nightly-only) for the full matrix + live-api-accessibility
   - Keeps RC3 CI honest on release gate without 2h cancel noise

   **Option B:** Raise timeout-minutes from 120 → 180 (or 240) for ui-e2e-live ONLY
   - Document expected runtime; still may fail later as suite grows

   **Option C:** Keep full matrix but drop CI retries to 0 for live config when CI=true
   - playwright.config.ts: retries: process.env.CI && !process.env.ARCHLUCID_CI_FULL_LIVE_A11Y ? 0 : …

3) Add a step timing echo before/after Playwright so the next pass can see slow files in logs.

4) Do NOT touch @live-a11y-full-matrix workflow_dispatch behavior yet.

Verify locally if possible with LIVE_E2E_SKIP_NEXT_BUILD=1 and a subset grep; full suite optional.

Do not commit unless I ask; summarize expected runtime impact.
```

---

## Prompt D — `ui-e2e-live` pass 2 (ApiKey/JWT jobs)

```
Branch: RC3

CI 28443661305 — ApiKey/JWT subset jobs: Start API step succeeded but Playwright specs hit 180s/240s timeouts.
(ApiKey log lines with curl 503 are from the readiness poll loop, not necessarily final failure.)

Compare env blocks:
  - ui-e2e-live (DevelopmentBypass, RateLimiting__Registration__PermitLimit: 500, E2eHarness secret)
  - ui-e2e-live-apikey / ui-e2e-live-jwt (~3679–3726, ~3820+ in ci.yml)

Tasks:
1) Download artifact ui-e2e-live-apikey-api-log from run 28443661305; find why slow specs hang (auth? seed data? missing harness?).
2) Align ApiKey/JWT startup with working ui-e2e-live / rc-release-gate patterns where safe:
   - Rate limits, CORS, AgentExecution__Mode: Simulator, catalog bootstrap
3) Identify the 4–6 slowest specs in the ApiKey subset; tag or split if they exceed job timeout-minutes: 30.

Minimal diff; warn-only jobs may stay warn-only.

Do not commit unless I ask.
```

---

## Prompt E — `ui-e2e-live` pass 3 (accessibility matrix cost)

```
Branch: RC3

Pass 3 — reduce live-api-accessibility.spec.ts cost in default CI (not workflow_dispatch full matrix):

File: archlucid-ui/e2e/live-api-accessibility.spec.ts (~80+ routes in PAGES array)

Options (choose one, minimal diff):
  A) Tag routes: @live-a11y-core (CI default) vs @live-a11y-full-matrix (dispatch/nightly only)
     Update ci.yml grep-invert to exclude full matrix always unless ARCHLUCID_CI_FULL_LIVE_A11Y=true
  B) Shard PAGES across 2–3 parallel jobs (each with own SQL+API) — only if pass 1 split isn't enough
  C) Dedupe canonical/legacy URL pairs already scanned twice (/reviews vs /runs duplicates)

Keep axe rule allowlist (axeLiveE2eDisableRuleIdsNow) unchanged unless a rule causes systematic false positives.

Verify: count tests before/after with `npx playwright test --list`.
Do not commit unless I ask.
```

---

## Prompt F — Merge coverage cascade (low priority)

```
Branch: RC3

CI 28443661305 — ".NET: merge coverage + gates" failed:
  ::error::No coverage.cobertura.xml files from regression shards.

Job dotnet-coverage-merge downloads artifacts coverage-full-regression-* (ci.yml ~2671–2693).

Check whether upstream shards uploaded artifacts on this run (especially slow-api/slow-domain).
If shards succeeded but merge found zero files, fix artifact path/glob in upload or download steps.
If shards skipped Coverlet by design, adjust merge job to skip gracefully when only integration shards ran.

Warn-only job — fix only if cheap; do not block RC work.
Do not commit unless I ask.
```

---

## Related docs

- [`docs/runbooks/RC_RELEASE_GATE.md`](../runbooks/RC_RELEASE_GATE.md) — blocking `ui-e2e-live-rc` subset
- [`docs/library/TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md) — CI tier map (may lag `ci.yml` timeouts)
- [`docs/runbooks/TRIAL_END_TO_END.md`](../runbooks/TRIAL_END_TO_END.md) — RLS bypass env for live API jobs
