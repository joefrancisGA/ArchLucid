# Code map (where to open first)

## 1. Objective

Reduce time-to-orientation for a developer or SRE by listing **high-signal paths** aligned to **interfaces → services → data → orchestration**.

## 2. Assumptions

- You build with **.NET 10** and **C#**; UI with **Next.js** under `archiforge-ui/`.

## 3. Constraints

- This map is **not** exhaustive; grep and `docs/DI_REGISTRATION_MAP.md` fill gaps.

## 4. Architecture overview

**Flow:** `ArchiForge.Api` / `ArchiForge.Worker` → `Host.Composition` (DI) → `Application` + `Persistence` → SQL / Azure services.

## 5. Component breakdown

| Concern | Path |
|---------|------|
| API startup | `ArchiForge.Api/Program.cs`, `ArchiForge.Api/Startup/` |
| Auth + ArchLucid bridge | `ArchiForge.Api/Auth/`, `ArchiForge.Api/Configuration/ArchiForgeAuthConfigurationBridge.cs` |
| Config merge (storage + auth keys) | `ArchiForge.Host.Core/Configuration/ArchiForgeConfigurationBridge.cs` |
| Storage + repository registration | `ArchiForge.Host.Composition/Configuration/ArchiForgeStorageServiceCollectionExtensions.cs` |
| Feature DI slices | `ArchiForge.Host.Composition/Startup/ServiceCollectionExtensions.*.cs` |
| Outbox operational metrics | `ArchiForge.Persistence/Diagnostics/DapperOutboxOperationalMetricsReader.cs`, `ArchiForge.Host.Core/Hosted/OutboxOperationalMetricsHostedService.cs` |
| OTel meters / gauges | `ArchiForge.Core/Diagnostics/ArchiForgeInstrumentation.cs` |
| SQL schema (master) | `ArchiForge.Persistence/Scripts/ArchiForge.sql` |
| UI API proxy | `archiforge-ui/src/app/api/proxy/[...path]/route.ts` |
| CD smoke + rollback | `.github/workflows/cd.yml`, `cd-staging-on-merge.yml` |
| ZAP tiers | `infra/zap/`, `.github/workflows/ci.yml`, `zap-baseline-strict-scheduled.yml` |
| Prometheus alerts | `infra/prometheus/archiforge-alerts.yml` |

## 6. Data flow

- **HTTP request:** Middleware → controller → application service → persistence repository → SQL.
- **Background:** Worker hosted services → outbox readers/processors → SQL / Service Bus.

## 7. Security model

- Policy: `ArchiForge.Api` authorization policies and `[Authorize]` usage; see `InfrastructureExtensions` for global auth notes.

## 8. Operational considerations

- **Health:** `ArchiForge.Host.Core/Health` and standard `MapHealthChecks` wiring.
- **Diagnostics:** admin outbox endpoints (versioned under `/v1/admin/...`) and build info `ArchiForge.Core/Diagnostics/BuildInfoResponse.cs`.
