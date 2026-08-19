> **Scope:** Operator smoke — first-party Azure Boards outbound work-item create; no tenant secrets or live keys.

# Smoke — Azure Boards (work management)

## Purpose

Confirm that a persisted **Authority-shaped finding** creates an **Azure Boards work item** with correlation in `dbo.ItsmFindingCorrelations`, matching the Phase 1 Azure Boards integration scope.

## Prerequisites

- Azure DevOps organization with a non-production project for pilot use.
- PAT with work item read/create scope for that project.
- Tenant connector row (`AzureBoards`) with organization URL and Key Vault secret name reference.
- `dbo.TenantAzureBoardsOutboundSettings` populated with project name and default work item type.
- `Integrations:ItsmOutbound:NativeEnabled` true for the deployment.

## Auth and secret pattern

- **Outbound:** PAT stored in Key Vault; SQL and UI reference **secret names** only.
- **Authentication header:** Basic auth with empty username and PAT as password (Azure DevOps REST convention).

## Test payload

```json
{
  "provider": "Azure Boards",
  "findingId": "<persisted finding id from inspect/manifest surface>"
}
```

`POST /v1/integrations/itsm/outbound/issues` with `ExecuteAuthority`.

## Expected audit events

| Step | Event type |
|------|------------|
| Happy path | `Integration.AzureBoardsWorkItemCreateSucceeded` |
| Duplicate | `Integration.AzureBoardsWorkItemCreateSkipped` |
| Failure | `Integration.AzureBoardsWorkItemCreateFailed` |

## Expected external artifact

- Work item in the configured project referencing the ArchLucid finding.
- Correlation row with provider label `Azure Boards` and external work item id.

## Rollback

- Close or remove pilot work items in Azure Boards.
- Retain correlation rows for audit unless your process requires cleanup.

## Troubleshooting

- **401/403:** Rotate PAT; confirm project-scoped token.
- **Skipped create:** Check audit reason (duplicate correlation, missing settings).
- **Invalid work item type:** Re-run work item type discovery after process template changes.
