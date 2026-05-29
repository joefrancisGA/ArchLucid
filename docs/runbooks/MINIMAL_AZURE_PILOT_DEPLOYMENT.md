> **Scope:** Smallest supported Azure pilot footprint — documentation only; does not run Terraform.

# Minimal known-good Azure pilot deployment

**Preferred region when unconstrained:** **US East** (assessment recorded decision).

## Required resources

| Resource | Purpose |
| --- | --- |
| Azure SQL (single catalog or system+tenant topology per config) | Primary persistence |
| Azure Container Apps or App Service (API + worker roles) | Host `ArchLucid.Api` / worker |
| Azure Key Vault (recommended) | Secrets |
| Azure OpenAI (when `AgentExecution:Mode=Real`) | Agent completion |
| Azure Blob Storage | Artifacts / extractor staging |
| Application Insights / Azure Monitor | Telemetry |

## Preflight (no apply)

1. Validate Terraform variables against [`infra/terraform-pilot`](../../infra/terraform-pilot) outputs table.
2. Run `archlucid config lint --simulate-production` against staged appsettings.
3. Run `archlucid pilot preflight --api-base-url https://<api-host>`.
4. Capture `./scripts/collect-first-pilot-evidence.ps1` after first committed review.

## Minimal validation checklist

| Area | Evidence command or source | Healthy result |
| --- | --- | --- |
| Live health | `GET /health/live` | HTTP 200 |
| Readiness | `GET /health/ready` | HTTP 200 with SQL readiness checks passing |
| Version stamp | `GET /version` | Version and commit present |
| API contract | `GET /openapi/v1.json` | OpenAPI JSON returns and matches the expected deployed contract |
| Auth posture | `archlucid config lint --simulate-production --hosting-advisor` | No production-like bypass or missing identity warnings |
| SQL readiness | readiness health + migration startup logs | Migrations completed; no failed DbUp step |
| Secrets posture | Key Vault references or redacted config summary | No raw secrets in logs or evidence files |
| Telemetry | App Insights / OTLP / Prometheus config summary | Telemetry export configured or explicitly waived for the pilot |
| Data consistency | `./scripts/collect-data-consistency-readiness.ps1 -BaseUrl https://<api-host>` | No blocking orphan or readiness finding |
| Pilot proof | `./scripts/collect-first-pilot-proof.ps1 -BaseUrl https://<api-host> -RunId <committed-run-guid>` | `go-no-go-summary.md` has no BLOCK rows |

## Evidence to capture at handoff

- `production-like-azure-pilot-proof.md` from `./scripts/collect-first-pilot-proof.ps1` (configured vs measured vs not-enabled)
- `/health/ready`, `/version`, `/openapi/v1.json`
- SQL migration success in startup logs
- Telemetry export status (App Insights connection string present)
- First-pilot evidence bundle (committed run)
- Data-consistency readiness output
- Procurement `--deal-ready` result when the buyer asks for security/procurement review

## Optional (V1)

- Private endpoints + WAF/Front Door
- Read replica routing
- Redis cache

## Explicit non-goals

- Multi-region active/active (V2)
- Mandatory Redis for all pilots
- Public exposure as the default enterprise posture when private endpoint routing is available

## Related

- [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md)
- [`RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md)
- [`DATA_CONSISTENCY_READINESS.md`](DATA_CONSISTENCY_READINESS.md)
- [`../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`](../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md)
