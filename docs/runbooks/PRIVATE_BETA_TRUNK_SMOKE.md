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
4. Shell warm (`scripts/ci/warm_private_beta_live_api_paths.sh`) — scope + invitations required; draft and create-run **best-effort** (Playwright JIT-warms create-run with 300s per-attempt HTTP budget)
5. Playwright `--workers=1` on `live-api-private-beta-access.spec.ts` (browser install runs in parallel with shell warm)

## Trunk milestones (2026-09-06)

| Milestone | Run / PR | Evidence |
| --- | --- | --- |
| Lockfile + typecheck unblocked | #1715 / `f5a907dfb0` | `Install UI deps, verify lockfile, and typecheck` **green** on run `34002442429` |
| First Playwright execution post-lockfile | #1715 / `34002442429` | Job passed install, build, API warm; Playwright step reached (45m per-test CI budget) |
| OpenAPI push corset unblocked | #1727 / `a63198e` | Snapshot regen after IE-UX + CA prompt API drift |
| First green private-beta on `master` | — | **Not yet** — do not add to golden-cohort ruleset until observed |

## Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Failed to warm draft inventory` before Playwright | Pre-#1669 required draft warm; cold SQL hang | **Shipped #1669** — draft warm is best-effort in CI |
| `Failed to warm create architecture run` before Playwright | Cold SQL + inline Simulator pipeline on first POST | **Shipped** — create-run warm is best-effort (300s default); Playwright `createRun` JIT-warms with 300s per-attempt budget |
| `npm ci` fails before Playwright (`package.json` / `package-lock.json` out of sync) | Override bumped in `package.json` without `npm install` (e.g. `@tanstack/query-core` **5.102.8**) | Run `npm install` in `archlucid-ui/`, commit lockfile; `check_npm_overrides_lockfile_sync.py` fails in beta-readiness guards pre-merge |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` red on push corset | API surface drift (e.g. IE-UX-01/02 infrastructure routes) without snapshot regen | `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` from repo root; commit `openapi-v1.contract.snapshot.json` + api-types |
| `Install UI deps, verify lockfile, and typecheck` fails | TypeScript drift on trunk before heavy `build:live-e2e` | Fix `npm run typecheck` locally; private-beta now typechecks before Next standalone build |
| `Install UI deps & build Next` fails (typecheck in `build:live-e2e`) | `architectureId` → `draftId` migration drift on trunk | **Shipped #1703** — align registry consumers and draft control props; re-run push |
| Playwright never starts | Shell warm `set -e` on required path | Check scope/invitations warm; API not ready |
| `GET /api/proxy/v1/architecture/draft` 60s timeout | Draft list hit before route stub | Spec stubs `**/api/proxy/v1/architecture/draft**`; ensure stub runs before `page.goto` |
| `POST /v1/architecture/request` 401 | JwtBearer / proxy token mismatch | `ARCHLUCID_PROXY_BEARER_TOKEN` must equal `LIVE_JWT_TOKEN` in workflow env |
| create-run retry exhaustion | Cold SQL / Simulator queue | `LIVE_E2E_PRIVATE_BETA_ACCESS=1` caps attempts (see `live-api-client.ts`) |
| Reviews hub row not visible | Run list poll lag | `waitForArchitectureRunListIncludesRun` + `reviews-hub-row-{runId}` test id |
| Actions queue backlog | Many trunk merges enqueue parallel corset/private-beta runs | Prefer verifying the **latest** `master` SHA run; stale queued runs may lag by hours |

## Artifacts

On failure, download from the workflow run:

- `ui-e2e-live-beta-access-on-push-playwright-report`
- `ui-e2e-live-beta-access-on-push-test-results`
- `ui-e2e-live-beta-access-on-push-api-log`

## Local reproduction (heavy)

Requires SQL Server, API with JwtBearer PEM, and `archlucid-ui` live-e2e build. See `docs/library/LIVE_E2E_JWT_SETUP.md`.

```bash
export LIVE_JWT_TOKEN="<minted>"
export ARCHLUCID_PROXY_BEARER_TOKEN="${LIVE_JWT_TOKEN}"
export LIVE_E2E_PRIVATE_BETA_ACCESS=1
cd archlucid-ui && npx playwright test live-api-private-beta-access.spec.ts --workers=1
```

## Ruleset apply (owner)

**Do not** add `Operator UI: private-beta access-path (JwtBearer)` to the golden-cohort ruleset until this job completes green at least once on `master`. See `.github/BRANCH_PROTECTION.md`.
