# CD post-deploy product-path smoke

**Script:** `scripts/ci/cd_post_deploy_product_smoke.py`  
**Wired in:** `.github/workflows/cd.yml` (`Smoke — product path`), `.github/workflows/cd-staging-on-merge.yml`

## Journey approximated

Operator opens the UI shell, the same-origin BFF reaches the API (`/api/proxy/health/ready`), and an authenticated read loads tenant workspaces plus the Why-ArchLucid snapshot (SQL-backed audit count) — the start of an operator session against the smoke API-key scope.

**Does not prove:** review create/commit, paid AI, notifications, or browser SSO login. Contoso baseline seed is **required on `target=dev`** (hosted RC showcase) and optional on staging/production.

## Required vs optional

| Check | Required | Pass criteria |
|-------|----------|---------------|
| `api_health_live` | Yes | HTTP 200 |
| `api_health_ready` | Yes | HTTP 200, JSON `status == Healthy` |
| `api_build_id` | Yes | `/version` `commitSha` == expected `BUILD_ID` |
| `api_openapi_authenticated` | Yes (when API key present / strict env) | HTTP 200 + `info.title` |
| `api_tenant_workspaces_read` | Yes (when API key present / strict env) | HTTP 200 + `workspaces` array |
| `api_why_archlucid_snapshot_read` | Yes (when API key present / strict env) | HTTP 200 + `demoRunId` |
| `ui_process_health` | Yes when UI base URL set | `/api/health` Healthy |
| `ui_bff_health_ready` | Yes when UI base URL set | `/api/proxy/health/ready` 200 / Healthy |
| `ui_public_shell_build_id` | Yes when UI base URL and `BUILD_ID` set | Cache-bypass `GET /welcome` HTML meta `archlucid:build-commit` == `BUILD_ID` |
| `api_contoso_run_summary` | **Yes on `dev`** (when API key present); optional on staging/production | Contoso baseline authority summary HTTP 200 |
| `ui_homepage` | Optional | `/` HTTP 200 |
| `ui_static_asset` | Optional | One `/_next/static/…` asset HTTP 200 |

**Strict environments:** `staging` and `production` fail closed if `SMOKE_TEST_BASE_URL` (or API key for auth checks) is missing. **`dev`** may skip when the smoke URL is unset.

## Summary artifact

Markdown + JSON under `artifacts/cd-product-smoke-<env>-<run_id>.{md,json}` and GitHub step summary:

| Check | Required | Result | Duration (ms) | Detail |
| --- | --- | --- | ---: | --- |

Plus expected / observed BUILD_ID (API, UI `/api/health`, and public-page meta when available).

## Frontend shell cache (TB-868)

[`FRONTEND_SHELL_CACHE.md`](FRONTEND_SHELL_CACHE.md) — immutable hashed assets vs version-sensitive HTML, Front Door honor-origin posture, and why routine deploys skip CDN purge.

## Related

- Infrastructure probes + deployment-evidence: [`docs/library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md)
- Live vs ready matrix: [`HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md`](HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md)
