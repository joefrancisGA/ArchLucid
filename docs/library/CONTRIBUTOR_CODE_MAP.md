> **Scope:** Contributor-reference — 1-page decision tree for new contributors, plus a high-signal path table (formerly `CODE_MAP.md`).
> **Reviewed:** 2026-07-23

# Contributor Code Map

Use this quick-reference to find where to make changes in the ArchLucid codebase based on your goal.

## 1. Modifying the API or Endpoints
**"I need to add or change an HTTP route."**
- **Location:** `ArchLucid.Api/Controllers/`
- **What to know:** Endpoints are organized by domain (e.g., `Authority`, `Governance`, `Tenancy`). You must apply the correct authorization policy (e.g., `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]`).

## 2. Changing Persistence or Database Logic
**"I need to modify how data is saved or retrieved."**
- **Location:** `ArchLucid.Persistence/`
- **What to know:** 
  - Sub-assemblies (e.g., Alerts, Advisory, Integration) have been consolidated into this single project to reduce cognitive load. 
  - Look in `Repositories/` for data access.
  - SQL Migrations live in `ArchLucid.Persistence/Migrations/`. Remember to add your `.sql` file as an Embedded Resource.

## 3. Editing the architect workspace
**"I need to change a React component or screen."**
- **Location:** `archlucid-ui/src/`
- **What to know:**
  - Pages and routing: `app/(operator)/`
  - Reusable components: `components/`
  - Sidebar navigation and progressive disclosure configuration: `lib/nav-config.ts` and `components/SidebarNav.tsx`

## 4. Modifying Architecture Agents or Pipelines
**"I need to adjust how the AI analyzes an architecture."**
- **Location:** `ArchLucid.Application/Runs/Orchestration/` and `ArchLucid.Decisioning/`
- **What to know:** 
  - The pipeline orchestrates the sequence of agent execution.
  - Golden Manifests have been renamed in the UI to "Committed Architecture Manifest", but internal types remain `GoldenManifest`.
  - **Custom in-repo handlers:** register `IAgentHandler` in `ArchLucid.Host.Composition` — see [`CUSTOM_AGENT_HANDLER_GUIDE.md`](CUSTOM_AGENT_HANDLER_GUIDE.md). **Out-of-process:** [`CUSTOM_AGENT_HANDLERS.md`](CUSTOM_AGENT_HANDLERS.md). V1 contract: [`V1_SCOPE.md`](V1_SCOPE.md) §2.18.

## 5. Adding a New Integration or Connector
**"I need to add a new ITSM sink (like Jira) or Slack webhook."**
- **Location:** `ArchLucid.Application/Integrations/`
- **What to know:** 
  - Webhooks use a unified Architecture Run payload. Do not invent a parallel schema. 
  - For UI setup, edit `archlucid-ui/src/app/(operator)/integrations/`.

## 6. Modifying Configuration or Startup
**"I need to add a new appsettings value."**
- **Location:** `ArchLucid.Host.Core/Configuration/` and `ArchLucid.Api/appsettings.json`
- **What to know:** 
  - Add your strongly-typed configuration class.
  - Do not add boilerplate defaults to `appsettings.json`—rely on the C# class defaults to keep the pilot startup clean.

## 7. Before Opening a PR
**"What else must I update for this change type?"**
- **Checklist:** [`CHANGE_IMPACT_CHECKLIST.md`](CHANGE_IMPACT_CHECKLIST.md) covers API routes/DTOs, SQL, config, architect workspace, commercial tiers, audit events, retrieval/agent behavior, pricing/trust docs, and V1 scope boundaries.
- **Generated map:** [`MAINTAINABILITY_BOUNDARY_MAP.generated.md`](MAINTAINABILITY_BOUNDARY_MAP.generated.md) (regenerate with `python scripts/ci/generate_maintainability_boundary_map.py`).
- **Change checklist (controller → app → SQL → audit):** [`GOLDEN_CHANGE_PATH.md`](GOLDEN_CHANGE_PATH.md).

## 8. High-signal paths (open first)

| Concern | Path |
|---------|------|
| API startup | `ArchLucid.Api/Program.cs`, `ArchLucid.Api/Startup/` |
| Auth + ArchLucid bridge | `ArchLucid.Api/Auth/`, `ArchLucid.Api/Configuration/ArchLucidAuthConfigurationBridge.cs` |
| Config merge (storage + auth keys) | `ArchLucid.Host.Core/Configuration/ArchLucidConfigurationBridge.cs` |
| Storage + repository registration | `ArchLucid.Host.Composition/Configuration/ArchLucidStorageServiceCollectionExtensions.cs` |
| Feature DI slices | `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.*.cs` |
| Outbox operational metrics | `ArchLucid.Persistence/Diagnostics/DapperOutboxOperationalMetricsReader.cs`, `ArchLucid.Host.Core/Hosted/OutboxOperationalMetricsHostedService.cs` |
| OTel meters / gauges | `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` |
| SQL schema (master) | `ArchLucid.Persistence/Scripts/ArchLucid.sql` |
| UI API proxy | `archlucid-ui/src/app/api/proxy/[...path]/route.ts` |
| CD smoke + rollback | `.github/workflows/cd.yml`, `cd-staging-on-merge.yml` |
| ZAP baseline (blocking) | `infra/zap/baseline-pr.tsv`, `.github/workflows/ci.yml` (`security-zap-api-baseline`), `zap-baseline-strict-scheduled.yml` |
| Prometheus alerts | `infra/prometheus/archlucid-alerts.yml` |
| Health wiring | `ArchLucid.Host.Core/Health` |
| Build info | `ArchLucid.Core/Diagnostics/BuildInfoResponse.cs` |

Gaps: grep and [`DI_REGISTRATION_MAP.md`](DI_REGISTRATION_MAP.md).
