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
2. Mint RS256 JWT (`scripts/ci/mint_ci_jwt.py`) with Admin role + default tenant scope
3. Shell warm (`scripts/ci/warm_private_beta_live_api_paths.sh`) — scope + invitations required; draft and create-run **best-effort** (Playwright JIT-warms create-run with 300s per-attempt HTTP budget)
4. Playwright `--workers=1` on `live-api-private-beta-access.spec.ts` (browser install runs in parallel with shell warm)

## Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Failed to warm draft inventory` before Playwright | Pre-#1669 required draft warm; cold SQL hang | **Shipped #1669** — draft warm is best-effort in CI |
| `Failed to warm create architecture run` before Playwright | Cold SQL + inline Simulator pipeline on first POST | **Shipped** — create-run warm is best-effort (300s default); Playwright `createRun` JIT-warms with 300s per-attempt budget |
| `Install UI deps & build Next` fails (typecheck in `build:live-e2e`) | `architectureId` → `draftId` migration drift on trunk | **Shipped #1703** — align registry consumers and draft control props; re-run push |
| Playwright never starts | Shell warm `set -e` on required path | Check scope/invitations warm; API not ready |
| `GET /api/proxy/v1/architecture/draft` 60s timeout | Draft list hit before route stub | Spec stubs `**/api/proxy/v1/architecture/draft**`; ensure stub runs before `page.goto` |
| `POST /v1/architecture/request` 401 | JwtBearer / proxy token mismatch | `ARCHLUCID_PROXY_BEARER_TOKEN` must equal `LIVE_JWT_TOKEN` in workflow env |
| create-run retry exhaustion | Cold SQL / Simulator queue | `LIVE_E2E_PRIVATE_BETA_ACCESS=1` caps attempts (see `live-api-client.ts`) |
| Reviews hub row not visible | Run list poll lag | `waitForArchitectureRunListIncludesRun` + `reviews-hub-row-{runId}` test id |

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
