> **Scope:** Engineering triage for `private-beta-access-on-push.yml` — invite-wave JwtBearer Playwright on trunk. Human proof runs (Gate 1, G-REAL-06) are separate.

# Private-beta trunk smoke — triage runbook

## Job

| Field | Value |
| --- | --- |
| Workflow | `.github/workflows/private-beta-access-on-push.yml` |
| Display name | `Operator UI: private-beta access-path (JwtBearer)` |
| Spec | `archlucid-ui/e2e/live-api-private-beta-access.spec.ts` |
| Timeout | 120 minutes (job); 45 minutes per Playwright test in CI |

## Happy path (CI step order)

1. Build API (Release) + Next standalone (`NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer`)
2. **Lockfile guard** → `npm ci` → query-core assert → **`npm run typecheck`** (fail fast before `build:live-e2e`)
3. Mint RS256 JWT (`scripts/ci/mint_ci_jwt.py`) with Admin role + default tenant scope
4. Shell warm (`scripts/ci/warm_private_beta_live_api_paths.sh`) — scope + invitations only when `LIVE_E2E_PRIVATE_BETA_ACCESS=1` (draft/create-run skipped; Playwright stubs draft and JIT-warms create-run)
5. Post-warm `wait-for-api-ready.sh` (90×2s) — recovers transient **503** after warm without a single-shot `curl`
6. Playwright `--workers=1` on `live-api-private-beta-access.spec.ts` (browser install completes **before** shell warm)

## Trunk milestones (2026-09-06)

| Milestone | Run / PR | Evidence |
| --- | --- | --- |
| Lockfile + typecheck unblocked | #1715 / `f5a907dfb0` | `Install UI deps, verify lockfile, and typecheck` **green** on run `34002442429` |
| First Playwright execution post-lockfile | #1715 / `34002442429` | Job passed install, build, API warm; Playwright step reached (45m per-test CI budget) |
| OpenAPI push corset unblocked | #1727 / `a63198e` | Snapshot regen after IE-UX + CA prompt API drift |
| First green private-beta on `master` | — | **Not yet** — do not add to golden-cohort ruleset until observed |
| Branch concurrency + health poll diagnostics | #1733 / `c2ee3fc91b` | Supersedes stale queued runs; logs HTTP status during `/health/ready` poll |
| Create-run preflight + identity desk e2e | #1736 / follow-up | `waitForLiveApiReady` before create-run; architecture identity desk smoke after run create |

## Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
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
| create-run retry exhaustion | Cold SQL / Simulator queue | `LIVE_E2E_PRIVATE_BETA_ACCESS=1` caps attempts at **5** with 120s pre-create health poll (see `live-api-client.ts`) |
| Reviews hub row not visible | Run list poll lag | `waitForArchitectureRunListIncludesRun` + `reviews-hub-row-{runId}` test id |
| Actions queue backlog | Many trunk merges enqueue parallel corset/private-beta runs | Workflow uses **branch concurrency** (`cancel-in-progress: true`) — verify the **latest** `master` SHA run; ignore cancelled superseded runs |
| Superseded run `cancelled` mid-Playwright | New trunk push cancelled an older SHA smoke | Expected with branch concurrency; triage only the newest run for the SHA you care about |

## Artifacts

On failure, download from the workflow run (newest non-cancelled run on the target SHA):

1. `ui-e2e-live-beta-access-on-push-api-log` — API stderr from `dotnet run` (SQL timeouts, auth, Simulator faults)
2. `ui-e2e-live-beta-access-on-push-playwright-report` — HTML trace summary
3. `ui-e2e-live-beta-access-on-push-test-results` — per-test screenshots and traces
4. `ui-e2e-live-beta-access-on-push-blob-report` — blob report for Playwright merge

**Triage order:** confirm Playwright step started (not stuck in queue) → check post-warm `/health/ready` lines in job log → open API log for exceptions during `createRun` → inspect Playwright trace for proxy/JWT failures.

For a machine-readable checklist, run `python3 scripts/ci/report_private_beta_playwright_failure_triage.py --markdown-out /tmp/private-beta-triage.md` from the repo root.

## Local reproduction (heavy)

Requires SQL Server, API with JwtBearer PEM, and `archlucid-ui` live-e2e build. See `docs/library/LIVE_E2E_JWT_SETUP.md`.

## Full-matrix dispatch (optional)

The same spec also runs in `.github/workflows/ci.yml` job `ui-e2e-live-beta-access` on **`workflow_dispatch`** full CI. Use **Actions → CI → Run workflow** on `master` when you need the private-beta smoke inside the full regression matrix (not only trunk push).

You can also re-run invite-wave smoke alone via **Actions → Private-beta access on push → Run workflow** (`workflow_dispatch` on `.github/workflows/private-beta-access-on-push.yml`).

```bash
export LIVE_JWT_TOKEN="<minted>"
export ARCHLUCID_PROXY_BEARER_TOKEN="${LIVE_JWT_TOKEN}"
export LIVE_E2E_PRIVATE_BETA_ACCESS=1
cd archlucid-ui && npx playwright test live-api-private-beta-access.spec.ts --workers=1
```

## Ruleset apply (owner)

**Do not** add `Operator UI: private-beta access-path (JwtBearer)` to the golden-cohort ruleset until this job completes green at least once on `master`. See `.github/BRANCH_PROTECTION.md`.
