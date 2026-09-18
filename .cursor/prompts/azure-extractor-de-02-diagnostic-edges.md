# AX-DE-02 — Diagnostic destination edges and labels

**Wave:** AX-DE. **Depends on:** AX-DE-01. **Do not** widen collector fan-out (that is **AX-DE-10**).

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Stop drawing diagnostic settings as generic **connects**. Use `diagnosticToDestination` and label **Sends diagnostics to**. Parse `storageAccountId` / `eventHubAuthorizationRuleId` (or Event Hub ARM id) when those fields already exist on a row.

## Why

`AddDiagnosticEdges` already emits `CONNECTS_TO` from `targetResourceId` → `workspaceId`. Log Analytics workspaces are **AlwaysDispose** on inventory peel, so the edge often has no visible destination. Collection still only stores workspace. This prompt is **mapper + label + row shape**, not a new ARM fan-out.

## Context

- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs` (`AddDiagnosticEdges`)
- `ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs` (diagnostic write)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence` diagnostic write/read models
- `AzureInventoryNeverShowArmTypes` / peel AlwaysDispose for `Microsoft.OperationalInsights/workspaces`

## What to build

1. Normalize companion row fields (optional, ignore if absent): `workspaceId`, `storageAccountId`, `eventHubResourceId` (or authorization-rule id stripped to the Event Hub / namespace parent if that is the inventoried node). Never persist keys.
2. Map each present destination to `diagnosticToDestination` / catalog graph edge + inference source. Provenance ObservedFact when dest is an ARM id.
3. Humanizer already stubbed in 01 — use **Sends diagnostics to**.
4. Do **not** reverse AlwaysDispose for Log Analytics on Network/Executive. Identity/Data Flow may keep the destination node if the compiler already includes it; do not add a new DiagramMode.
5. Completeness: if a diagnostic row has a name but no destination ids, warning `diagnostic-destination-unresolved`.
6. Tests: workspace-only row → one edge with new association type; storage dest → second edge; missing dest → warning and no edge; existing ADF tests unchanged.

## Acceptance criteria

- No new ARM list in this prompt.
- Hosted and Tier 1 still emit `[]` when collection skipped.
- SQL column add is allowed only if existing `WorkspaceResourceId` cannot hold three dest kinds — prefer extra nullable columns or a destination-kind + destination-id pair on the existing diagnostic table. If you add SQL: next DbUp + `ArchLucid.sql` + rollback + tenant isolation test.

## Constraints

- Do not collect more resource types (**AX-DE-10**).
- Do not claim traffic.
- Compile: Application.Tests filter `FullyQualifiedName~Diagnostic` plus ArtifactSynthesis humanizer tests.

## Done when

Fixture with storage + SQL diagnostic-to-workspace draws **Sends diagnostics to**, not **connects**.
