> **Scope:** Engineering triage for `private-beta-access-on-push.yml` — invite-wave JwtBearer Playwright on trunk. Human proof runs (Gate 1, G-REAL-06) are separate. Insight-density findings in beta reviews remain **advisory** under the ADR 0070 gate (`typed-engine-scored` telemetry) — do not treat them as procurement attestations.

# Private-beta trunk smoke — triage runbook

## Job

| Field | Value |
| --- | --- |
| Workflow | `.github/workflows/private-beta-access-on-push.yml` |
| Display name | `Operator UI: private-beta access-path (JwtBearer)` |
| Specs (push workflow, `--workers=1`) | `live-api-scim-invite-substitute-smoke.spec.ts`, `live-api-invite-flow.spec.ts`, `live-api-private-beta-wave-3.spec.ts`, `live-api-private-beta-access.spec.ts` (lighter specs first for faster CI signal) |
| Timeout | 120 minutes (job); 45 minutes per Playwright test in CI |

## Happy path (CI step order)

1. Build API (Release) + Next standalone (`NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer`)
2. **Lockfile guard** → `npm ci` → query-core assert → **`npm run typecheck`** (fail fast before `build:live-e2e`)
3. Mint RS256 JWT (`scripts/ci/mint_ci_jwt.py`) with Admin role + default tenant scope
4. Shell warm (`scripts/ci/warm_private_beta_live_api_paths.sh`) — scope + invitations only when `LIVE_E2E_PRIVATE_BETA_ACCESS=1` (draft/create-run skipped; Playwright stubs draft and JIT-warms create-run)
5. Post-warm `wait-for-api-ready.sh` (90×2s) — recovers transient **503** after warm without a single-shot `curl`
6. Playwright `--workers=1` on all four private-beta specs (browser install completes **before** shell warm)

## Trunk hygiene during corset outages

When `ui-typecheck-on-push.yml` is red on `master`, **pause feature merges** until push corset is green again. Burst merges bury the failing job name in the Actions queue and delay the first post-fix `private-beta-access-on-push` run. After a typecheck hotfix lands, wait for **both**:

1. `Operator UI: typecheck (blocking)` **success** on `master`
2. `Operator UI: private-beta access-path (JwtBearer)` to finish (success or actionable Playwright failure)

Only then dispatch the full matrix (`bash scripts/ci/dispatch_full_ci_matrix.sh master`) or widen required ruleset checks.

## Trunk milestones (2026-09-06)

| Milestone | Run / PR | Evidence |
| --- | --- | --- |
| Lockfile + typecheck unblocked | #1715 / `f5a907dfb0` | `Install UI deps, verify lockfile, and typecheck` **green** on run `34002442429` |
| First Playwright execution post-lockfile | #1715 / `34002442429` | Job passed install, build, API warm; Playwright step reached (45m per-test CI budget) |
| OpenAPI push corset unblocked | #1727 / `a63198e` | Snapshot regen after IE-UX + CA prompt API drift |
| First green private-beta on `master` | — | **Not yet** — do not add to golden-cohort ruleset until observed |
| Branch concurrency + health poll diagnostics | #1733 / `c2ee3fc91b` | Supersedes stale queued runs; logs HTTP status during `/health/ready` poll |
| Create-run preflight + identity desk e2e | #1736 / `ecbe600a7b` | `waitForLiveApiReady` before create-run; architecture identity desk smoke after run create |
| Loader smoke + signin/invite Report Problem | #1792 / `159c5fab6a` | Vitest `e2e/live-api-private-beta-access.loader-smoke.test.ts`; TB-782 surfaces on `/auth/signin` + `/auth/invite` |
| Wave 3 bootstrap recovery + diagnostics/deep-link smoke | #2154 / wave 3 | `live-api-private-beta-wave-3.spec.ts`; mid-flow Report Problem on `/auth/bootstrap`; `GITHUB_STEP_SUMMARY` failure triage |

## Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `TypeError: sandbox-mock-data.json needs an import attribute` / Playwright **No tests found** | Bare JSON import in `sandbox-api-mocks.ts` under Node ESM loader | Use `import … with { type: "json" }`; `check_live_api_private_beta_access_ci_wiring.py` guards the pattern; Vitest `e2e/live-api-private-beta-access.loader-smoke.test.ts` imports the helper chain pre-CI |
| `Operator UI: jwt-bearer production build` fails on `docs pdf render` / `PagedResponseOfArchitectureIdentityListItem` | `ArchLucid.Cli` client drift after `ArchitectureIdentityListPage` API change | Regenerate `ArchLucid.Api.Client` and align `ArchLucidCliApiClient.Architectures.cs`; `build-docs-pdf.ts` preflights `dotnet build` on Cli |
| `Failed to warm draft inventory` before Playwright | Pre-#1669 required draft warm; cold SQL hang | **Shipped #1669** — draft warm is best-effort in CI |
| `Failed to warm create architecture run` before Playwright | Cold SQL + inline Simulator pipeline on first POST | **Shipped** — create-run warm is best-effort (300s default); Playwright `createRun` JIT-warms with 300s per-attempt budget |
| `npm ci` fails before Playwright (`package.json` / `package-lock.json` out of sync) | Override bumped in `package.json` without `npm install` (e.g. `@tanstack/query-core` **5.102.8**) | Run `npm install` in `archlucid-ui/`, commit lockfile; `check_npm_overrides_lockfile_sync.py` fails in beta-readiness guards pre-merge |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` red on push corset | API surface drift (e.g. IE-UX-01/02 infrastructure routes) without snapshot regen | `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` from repo root; commit `openapi-v1.contract.snapshot.json` + api-types |
| `Install UI deps, verify lockfile, and typecheck` fails | TypeScript drift on trunk before heavy `build:live-e2e` | Fix `npm run typecheck` locally; private-beta now typechecks before Next standalone build |
| `Install UI deps & build Next` fails (typecheck in `build:live-e2e`) | `architectureId` → `draftId` migration drift on trunk | **Shipped #1703** — align registry consumers and draft control props; re-run push |
| `curl: (22) … error: 503` on `/health/ready` immediately before Playwright | 300s create-run shell warm blocked API; single-shot health `curl` | **Shipped** — skip draft/create-run shell warm in invite-wave CI; use `wait-for-api-ready.sh` with retries |
| Playwright never starts | Shell warm `set -e` on required path | Check scope/invitations warm; API not ready |
| `GET /api/proxy/v1/architecture/draft` 60s timeout | Draft list hit before route stub | Spec stubs `**/api/proxy/v1/architecture/draft**`; ensure stub runs before `page.goto` |
| `POST /v1/architecture/request` 401 | JwtBearer / proxy token mismatch | `ARCHLUCID_PROXY_BEARER_TOKEN` must equal `LIVE_JWT_TOKEN` in workflow env |
| Wave-3 / invite / create-run **401** after ~50m+ Playwright | CI JWT minted before shell warm; default 1h `exp` elapsed mid-suite | **Shipped** — `refresh_private_beta_ci_jwt.sh` re-mints (7200s exp) immediately before Playwright after warm |
| create-run retry exhaustion | Cold SQL / Simulator queue | `LIVE_E2E_PRIVATE_BETA_ACCESS=1` caps attempts at **5** with 120s pre-create health poll (see `live-api-client.ts`) |
| Reviews hub row not visible | Run list poll lag | `waitForArchitectureRunListIncludesRun` + `reviews-hub-row-{runId}` test id |
| Actions queue backlog | Many trunk merges enqueue parallel private-beta runs on different SHAs | Workflow uses **ref-level concurrency** (`private-beta-access-on-push-${{ github.ref }}`, `cancel-in-progress: true`) — only the latest `master` push runs; superseded SHAs cancel mid-flight. After heavy merge churn, **wait for the queue to drain** then `bash scripts/ci/retrigger_private_beta_access_on_push.sh master` so one run can finish Playwright. |
| Superseded run `cancelled` mid-Playwright | New trunk push cancelled an older SHA smoke | Expected with branch concurrency; triage only the newest run for the SHA you care about |

**Re-trigger after cancellation:** from a clone with `gh` authenticated:

```bash
bash scripts/ci/retrigger_private_beta_access_on_push.sh master
```

Or **Actions → Private-beta access on push → Run workflow** (`workflow_dispatch`).

### Smoke branch (merge-heavy trunk)

When `master` merge churn keeps cancelling `private-beta-access-on-push` mid-Playwright, use the **frozen** isolated lane (do not merge `master` into it until the run finishes):

| Field | Value |
| --- | --- |
| Branch | `cursor/al-beta-private-beta-frozen-7730` |
| Pin | `scripts/ci/private_beta_frozen_branch.sha` |
| Workflow | `.github/workflows/private-beta-access-smoke-branch.yml` |
| Concurrency | `cancel-in-progress: false` (runs finish even if the lane branch is pushed again) |
| Runbook | [PRIVATE_BETA_FROZEN_BRANCH.md](./PRIVATE_BETA_FROZEN_BRANCH.md) |

Legacy lane branches (`cursor/al-beta-private-beta-smoke-lane-7730`, `cursor/al-beta-private-beta-e2e-fixes-7730`) may still exist; use **`workflow_dispatch`** or the frozen branch for new point-in-time runs.

```bash
bash scripts/ci/retrigger_private_beta_smoke_branch.sh cursor/al-beta-private-beta-frozen-7730
```

Artifact names use the `-smoke-branch` suffix (e.g. `ui-e2e-live-beta-access-smoke-branch-playwright-report`).

## Artifacts

On failure, download from the workflow run (newest non-cancelled run on the target SHA):

1. `ui-e2e-live-beta-access-on-push-api-log` — API stderr from `dotnet run` (SQL timeouts, auth, Simulator faults)
2. `ui-e2e-live-beta-access-on-push-playwright-report` — HTML trace summary
3. `ui-e2e-live-beta-access-on-push-test-results` — per-test screenshots and traces
4. `ui-e2e-live-beta-access-on-push-blob-report` — blob report for Playwright merge
5. `ui-e2e-live-beta-access-on-push-failure-triage` — machine-readable triage rollup (push workflow)
6. `ui-e2e-live-beta-access-failure-triage` — same rollup from full-matrix `ci.yml` job

**Triage order:** confirm Playwright step started (not stuck in queue) → check post-warm `/health/ready` lines in job log → open API log for exceptions during `createRun` → inspect Playwright trace for proxy/JWT failures.

For a machine-readable checklist, run `python3 scripts/ci/report_private_beta_playwright_failure_triage.py --markdown-out /tmp/private-beta-triage.md` from the repo root.

**Download artifacts from a finished smoke run:**

```bash
bash scripts/ci/fetch_private_beta_smoke_artifacts.sh <run-id> ./triage-out --lane smoke-branch
```

Use `--lane trunk` for `private-beta-access-on-push` or `--lane full-matrix` for `ci.yml` `ui-e2e-live-beta-access`.

**OpenAPI drift on push corset:** when `.NET: OpenAPI v1 contract snapshot (fail-fast)` fails after architecture or infrastructure API merges, regenerate from repo root:

```bash
ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh
git add ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json archlucid-ui/src/lib/api-types archlucid-ui/packages/api-types
```

Then re-run `npm run typecheck` in `archlucid-ui` before pushing.

## Local reproduction (heavy)

Requires SQL Server, API with JwtBearer PEM, and `archlucid-ui` live-e2e build. See `docs/library/LIVE_E2E_JWT_SETUP.md`.

## Full-matrix dispatch (optional)

The same spec also runs in `.github/workflows/ci.yml` job `ui-e2e-live-beta-access` on **`workflow_dispatch`** full CI. Use **Actions → CI → Run workflow** on `master` when you need the private-beta smoke inside the full regression matrix (not only trunk push).

```bash
bash scripts/ci/dispatch_full_ci_matrix.sh master
# Optional extended live-a11y matrix:
bash scripts/ci/dispatch_full_ci_matrix.sh master true
```

You can also re-run invite-wave smoke alone via **Actions → Private-beta access on push → Run workflow** (`workflow_dispatch` on `.github/workflows/private-beta-access-on-push.yml`).

```bash
bash scripts/ci/retrigger_private_beta_access_on_push.sh master
```

```bash
export LIVE_JWT_TOKEN="<minted>"
export ARCHLUCID_PROXY_BEARER_TOKEN="${LIVE_JWT_TOKEN}"
export LIVE_E2E_PRIVATE_BETA_ACCESS=1
cd archlucid-ui && npx playwright test live-api-private-beta-access.spec.ts --workers=1
```

```bash
cd archlucid-ui && npx playwright test live-api-scim-invite-substitute-smoke.spec.ts live-api-invite-flow.spec.ts live-api-private-beta-wave-3.spec.ts live-api-private-beta-access.spec.ts --workers=1
```

## Golden-cohort apply (owner, after first green)

When `Operator UI: private-beta access-path (JwtBearer)` completes green at least once on `master`:

1. Apply [`.github/rulesets/golden-cohort-gate-private-beta-addon.json`](../../.github/rulesets/golden-cohort-gate-private-beta-addon.json) via `scripts/ci/apply-golden-cohort-gate-ruleset.ps1` (or merge into `golden-cohort-gate-required-check.json`).
2. Re-run the ruleset script (or add the check in GitHub Rulesets UI).
3. Confirm trunk push still runs all four private-beta specs (`live-api-private-beta-access`, `live-api-private-beta-wave-3`, `live-api-invite-flow`, `live-api-scim-invite-substitute-smoke`) before sending beta invites.

**Do not** add the private-beta check to golden-cohort required checks until step 1 completes after a verified green run.

## Ruleset apply (owner)

**Do not** add `Operator UI: private-beta access-path (JwtBearer)` to the golden-cohort ruleset until this job completes green at least once on `master`. See `.github/BRANCH_PROTECTION.md`.
