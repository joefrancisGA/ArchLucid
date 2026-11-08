# EXW-02 — Classify the Fabric capacity workspace HTTP error

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-03 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Classify this package warning and stop:

`fabric-capacity-assignments-not-collected:http-error:/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/resourceGroups/anly-edw-dev-hi/providers/Microsoft.Fabric/capacities/hihapfabriccapcitynprd`

## Why

401 and 403 would have been `insufficient-permission`. This warning is `http-error`, so the status was something else, or the call threw before a status was kept. Workspace assignment is what draws **Hosts** from the capacity.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Capacity resource id in the warning above
- Collector call: `GET {capacity}/workspaces?api-version=2024-05-01`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop.

1. GET the capacity resource at `api-version=2023-11-01`. Record HTTP status and `properties.provisioningState` when the body is JSON. Do not print SKU keys or admin lists.
2. GET `{capacity}/workspaces?api-version=2024-05-01`. Record HTTP status. On success, record how many `value` entries exist and how many ids start with `/subscriptions/`. Do not print workspace display names.

Read the status split in `Add-ArchLucidAzureFabricCapacityWorkspaceAssociationRows` before the probe.

## How to classify

| Status | Class |
|--------|--------|
| 401 or 403 | Permission. The identity needs `Microsoft.Fabric/capacities/read` and permission to list workspaces on the capacity (Fabric admin, or the tenant's documented equivalent). |
| 404 | This capacity has no workspace child at `2024-05-01`, or the id is wrong. Quote ARM `error.code`. |
| Other 4xx or 5xx | Azure or Fabric API error. Quote ARM `error.code` and `error.message`. |
| 200 with one or more workspace ids under `/subscriptions/` | Collection should succeed on the next package run. |
| 200 with workspace ids that are not ARM ids | Expect `fabric-capacity-workspaces-outside-inventory` after the next run. That warning is not a collection failure. |
| 200 with an empty list | No assignment is stored. The capacity stays unconnected. No extra warning is required. |

## Report

Reply with the class, both HTTP statuses, the workspace count, and the single next action. Do not grant a role. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not assign RBAC or change the capacity.
- Do not print tokens or workspace contents.
- Do not re-run NR-40.
