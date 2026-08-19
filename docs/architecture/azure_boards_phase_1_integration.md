# Azure Boards Phase 1 integration — implementation report

**Date:** 2026-07-13  
**Scope:** Work-management integration parity slice with existing Jira outbound architecture (not Azure Repos/Pipelines/cloud).

## Jira capability matrix (repository evidence)

| Capability | Jira today | Phase 1 classification | Azure Boards Phase 1 |
|------------|------------|--------------------------|----------------------|
| Integration route | `/integrations/jira` | Required | `/integrations/azure-boards` |
| Nav entry (Integrations, not Cloud) | Yes | Required | Yes — after Jira |
| Page layout (status, settings, test, aside) | Thin on Jira; ServiceNow is richer | Required | ServiceNow-style page |
| Connection configuration | Tenant ITSM connector + host options | Required | PAT via `TenantItsmConnectorConnections` (`AzureBoards`) |
| Authentication | API token / OAuth paths | Required (safest available) | PAT via Key Vault secret name (`BasicApiToken`, empty username) |
| Connection test | `GET /v1/integrations/itsm/health` probe | Required | `POST /v1/integrations/azure-boards/test-connection` + health GET |
| Project discovery | Not implemented (manual project key) | Valuable | **Implemented** — `GET .../projects` |
| Issue/work-item type selection | Static JSON severity map | Required minimum | **Dynamic** — `GET .../projects/{project}/work-item-types` |
| Finding export (clipboard) | `CopyFindingAsWorkItemButton` | N/A (separate) | Unchanged; includes Azure DevOps markdown format |
| Outbound create from finding | `POST /v1/integrations/itsm/outbound/issues` | Required | Same endpoint, `provider: "Azure Boards"` |
| Correlation / traceability | `dbo.ItsmFindingCorrelations` | Required | Same table, provider label `Azure Boards` |
| Duplicate prevention | Per finding + provider | Required | Reused `ItsmOutboundIssueCreationService` |
| Field mapping (severity) | Issue type by severity JSON | Required minimum | Priority 1–4 via `AzureBoardsPriorityMapper` |
| Inbound status sync | Jira webhook inbound | Defer unless shared model | **Deferred** (no Azure Boards inbound in Phase 1) |
| Webhooks / callbacks | Jira inbound controller | Jira-specific inbound | Not applicable |
| OAuth consent UI | Partial / redirected | Defer | Not applicable (PAT chosen) |
| Integration readiness hub | `ConnectorOperationsSummaryReader` | Required | `azureBoards` connector surface added |
| Audit events | Jira create succeeded/failed/skipped | Required | `Integration.AzureBoardsWorkItemCreate*` |
| Commercial tier gate | Standard tenant tier on ITSM routes | Required | Same on Azure Boards API |
| Tests | Jira/ITSM unit + UI tests | Required | Added Azure Boards backend + UI tests |
| Documentation | Smoke + recipes | Required | Customer guide + smoke doc |

### Parity decisions

- **Aligned to actual Jira outbound job:** one-click create from finding with auditable correlation — not a full ITSM admin console clone.
- **Exceeded Jira on discovery:** project and work-item-type lists are dynamic (Jira still uses manual project key).
- **Did not claim inbound sync parity:** Jira has inbound webhooks; Azure Boards inbound deferred intentionally.
- **Did not implement OAuth:** PAT + Key Vault secret names match existing secure credential-reference pattern and least-privilege operator workflow.

## Authentication decision

| Option | Decision |
|--------|----------|
| PAT via Key Vault secret name | **Selected** — matches `TenantItsmConnectorConnections`, no raw secrets in SQL/UI/logs |
| OAuth / Entra | Deferred — no established Azure DevOps OAuth consent flow in repo |
| Deployment fallback | `Integrations:ItsmOutbound:AzureBoards:OrganizationBaseUrl` + `PersonalAccessToken` for pilots |

**Permission scope:** work item read/create and project metadata only; no repo/pipeline/admin scopes in connector design.

## Shared abstractions reused

- `IExternalTicketConnector` / `ItsmOutboundIssueCreationService`
- `dbo.ItsmFindingCorrelations` + duplicate guard
- `TenantItsmConnectorConnections` credential references
- `ItsmOutboundHttpAuthenticator` (PAT basic auth for Azure Boards)
- `ItsmNativeIntegrationGate` (deployment flag for native create)
- `ConnectorOperationsSummaryReader` pattern
- `PageHeading` + nav icon SSOT

## New abstractions introduced

- `AzureBoardsExternalTicketConnector` + `AzureBoardsOutboundIssueClient`
- `IAzureBoardsIntegrationService` (test, list projects/types)
- `ITenantAzureBoardsOutboundSettingsRepository` + `dbo.TenantAzureBoardsOutboundSettings`
- `AzureBoardsIntegrationsController` (`/v1/integrations/azure-boards/*`)
- UI: `AzureBoardsIntegrationPageClient`, `azure-boards-api.ts`, `azure-boards-integration-present.ts`

## Route and navigation

| Surface | Value |
|---------|--------|
| Route | `/integrations/azure-boards` |
| Nav label | Azure Boards |
| Icon | `SquareKanban` (`AZURE_BOARDS_SURFACE_ICON`) |
| Breadcrumb | Integrations → Azure Boards |
| Permission | `admin-only` route readiness |
| Cloud neutrality | Not under Cloud connections; explicit AWS/GCP note on page |

## Fields mapped (Phase 1)

| ArchLucid | Azure Boards |
|-----------|----------------|
| Finding severity (Critical–Low) | `Microsoft.VSTS.Common.Priority` 1–4 |
| Summary / description payload | Title + HTML description with finding link |
| Default tags (settings) | Applied on create |
| Area path / iteration path (optional settings) | WIT field paths when configured |

## Security controls

- Secrets stored as Key Vault secret **names** only in tenant SQL
- PAT input uses `type="password"`; never repopulated after save
- Customer-facing errors sanitized (`sanitizeCustomerFacingProbeSummary`)
- Tenant isolation via existing scope context on all APIs
- Audit on create success/fail/skip without credential material

## Migrations

- `ArchLucid.Persistence/Migrations/275_AzureBoardsWorkManagement.sql`
- Appended to `ArchLucid.Persistence/Scripts/ArchLucid.sql`

## Files changed (representative)

**Backend:** Azure Boards application layer, API controller, ITSM provider enum extensions, connector registration, audit event types, persistence repositories, migration.

**UI:** Integration page, nav builder, finding create dialog/quick actions, connector readiness presentation, API clients, tests.

**Docs:** This report, `docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md`, `docs/integrations/smoke/CONNECTOR_SMOKE_AZURE_BOARDS.md`.

## Tests run

```text
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~AzureBoards"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~AzureBoards"
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ItsmOutboundLocalConfigurationEvaluator"
cd archlucid-ui && npm run test -- --run azure-boards operate-integrations-nav PageHeading.nav-identity ItsmOutboundQuickActions
```

## Recommended next phase

1. Inbound work-item state sync (only if product commits to shared ITSM inbound model).
2. OAuth / Entra delegated auth for enterprises that block PATs.
3. Per-process custom field mapping UI (beyond priority/tags/area/iteration).
4. Connection-test timestamp persistence on explicit test (mirror ServiceNow UX).
5. OpenAPI regen for Azure Boards DTOs in `openapi-schemas`.

## Capabilities deferred

- Azure Repos, Pipelines, Artifacts, Test Plans
- Bidirectional status synchronization
- OAuth consent UI
- Rich field-mapping studio
- Test work-item creation during connection test
