# AX-DC-04 — Completeness warnings in API + workbench

**Wave:** AX-DC. **Depends on:** AX-DC-01. **Do not** add collectors.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

Surface `AzureInventorySecurityEdgeMaterializer.CompletenessWarnings` (and package-level collection warnings already merged into snapshot metadata) as a **stable string list** on the infra-evidence diagram API and a **non-blocking banner** on `DiagramsWorkbenchClient` when warnings exist.

## Why

Materializers already emit actionable strings: `rbac-scope-too-broad:/subscriptions/...`, `app-settings-not-collected-hosted-get-only`, `adf-factory-has-no-linked-services`, `association-type-unmapped:...`, etc. Only `WarningCount` reaches the UI today — operators cannot see *why* authorization or hostname edges are missing.

## Context

- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` — `CompletenessWarnings`
- `ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs` — `WarningCount`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipCompletenessWarningCodes.cs` (+ ADF/diagnostic/paas sibling code files)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- Infra-evidence snapshot detail / mermaid API handlers (find current DTO — extend additively)

## What to build

1. Persist completeness warning strings on the snapshot row or a sibling JSON column if not already stored — prefer **re-materialize list from stored ZIP** on read if warnings are deterministic from package contents; if only count is stored today, add optional `completenessWarnings: string[]` on snapshot detail read model (additive API field).
2. Expose on GET paths used by Diagrams workbench (mermaid compile + snapshot picker) — stable ordering (ordinal sort).
3. UI: `InfraEvidenceCompletenessWarningsBanner` (or inline in workbench):
   - Shows when `warnings.length > 0`
   - Collapsible list; map known codes to one-line human hints (e.g. `rbac-scope-too-broad` → “Role assignment scope is subscription or resource group — app→resource edges were not expanded.”)
   - Do not block render; do not claim completeness when warnings present
4. Tests:
   - Application.Tests: materialized snapshot returns warnings array matching materializer output
   - `DiagramsWorkbenchClient.test.tsx`: banner visible when API returns warnings; hidden when empty
5. Do not log secret values. Warning strings are already sanitized codes + ARM ids — truncate long scopes in UI display if needed.

## Acceptance criteria

- Hosted package with `app-settings-not-collected-hosted-get-only` shows banner text referencing Tier 1 `-IncludeAppSettingsHosts`.
- Subscription-scoped RBAC fixture shows `rbac-scope-too-broad` in banner.
- `WarningCount` and list length stay consistent.

## Constraints

- `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~CompletenessWarning|SecurityEdgeMaterializer'`
- `cd archlucid-ui && npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
- Heartbeat if >15s.

## Done when

Operators see completeness warnings without opening SQL or ZIP JSON.
