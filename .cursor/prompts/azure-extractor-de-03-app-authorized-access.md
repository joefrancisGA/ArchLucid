# AX-DE-03 — App authorized access (MI + RBAC join)

**Wave:** AX-DE. **Depends on:** AX-DE-01. **Do not** call Graph or `config/list`.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Compose **compute ARM id → data/resource scope** as `appAuthorizedAccess` when the resource’s managed identity principal matches a `role-assignments.json` principal. Diagram label: **May access**. Provenance: DerivedFact. Never “confirmed dependency” or ADF **Reads from**.

## Why

Role assignments already create principal-node `HAS_ROLE` / `CAN_READ` / `CAN_WRITE`. Identity flatten today walks **user-assigned identity ARM ids**, not system-assigned `identity.principalId`. Architecture diagrams therefore miss Web App → SQL even when both facts are in the ZIP.

## Context

- `AzureInventorySecurityEdgeMaterializer` (`AddRoleAssignmentEdges`, `ExtractAssignedIdentityArmIds`, `TryParseIdentityJson`)
- `HostedAzureInventoryResourcePropertyExpander.AddIdentityProperties`
- `AzureInventoryRbacDataPlaneRoleMap`
- `docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md` §4.2

## What to build

1. Parse `identity` JSON for: `principalId` (system-assigned), `type`, and each `userAssignedIdentities` entry’s ARM id **and** nested `principalId` when present. Null-check. Do not persist secrets.
2. Build principalId → compute ARM ids (App Service/Function `Microsoft.Web/sites`, VM, VMSS, Container Apps, ADF, AKS, Databricks if present). Skip empty principalId.
3. For each role assignment whose `principalId` matches, if `AzureInventoryRbacDataPlaneRoleMap` is Read and/or Write, emit `appAuthorizedAccess` from **compute resource** → **assignment.scope** when scope is an ARM resource id in the snapshot (or a parent of an inventoried child, e.g. SQL server when assignment is on the server).
4. Subscription- or RG-wide scope: do **not** fan out to every resource. Emit completeness warning `rbac-scope-too-broad:{scope}` (or reuse existing unmapped warning). Optional: one edge to the RG/subscription node only if that node already exists — never explode.
5. PIM eligible / unknown: do not emit `appAuthorizedAccess` (keep existing skip).
6. Humanizer: **May access** for `appAuthorizedAccess`. Do not reuse **Reads from** (ADF).
7. Tests (must fail on current master):
   - Web App system-assigned principal + `SQL DB Contributor` on a SQL database ARM id → one `appAuthorizedAccess` WebApp→database.
   - User-assigned identity ARM id on the app + assignment on that UAMI principal → same.
   - Assignment principal with no matching compute identity → no app edge (principal HAS_ROLE may still exist).
   - Subscription-scoped Storage Blob Data Contributor → warning, no per-account explosion.

## Acceptance criteria

- No new ZIP file. No Graph. No secrets.
- Identity diagram `USES_IDENTITY` may remain; this prompt adds the **composed hop** for architecture/data-flow overlays.
- Do not inject these edges onto Network mode as the spine (PE remains gold). Data Flow / Identity / Executive may show **May access** if those compilers already draw inventory relationships — if Network would drown, hide `appAuthorizedAccess` on Network only (document in test).

## Constraints

- One class per new helper. Compile Application.Tests filter `FullyQualifiedName~AuthorizedAccess` or `RoleAssignment`.
- Heartbeat if >15s.

## Done when

A fixture proves Web App **May access** SQL from ZIP identity + RBAC without ADF companions.
