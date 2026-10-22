# SN-PE-05 — Messaging RBAC direction (not ARM destinations)

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-03. **Do not** implement SN-PE-06–07 except role-map tests.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Treat Service Bus and Event Hub as **nodes** plus **authorization** (and existing capture), not as Event Grid–style destination records. Map well-known Sender/Receiver data-plane roles so Data Flow can show **May write** / **May read** without inventing producers from a namespace.

## Why

Owner advice put Service Bus and Event Hub in “Tier 1 — nearly guaranteed” next to Event Grid. A queue does not know its senders. AX-DE-13 already lists children and Event Hub **capture** (declared). `AzureInventoryRbacDataPlaneRoleMap` today knows Blob/SQL Contributor and Blob Reader — not `Azure Service Bus Data Sender` / `Data Receiver` / Event Hubs equivalents. Unknown roles return `None` and never become `appAuthorizedAccess`.

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §§4–5
- `ArchLucid.Core/InfraEvidence/AzureInventoryRbacDataPlaneRoleMap.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppAuthorizedAccessEdgeMapper.cs`
- AX-DE-03 (do not re-collect RBAC)
- SN-PE-01 direction enum (`MayRead` / `MayWrite` vs `MayAccess`)

## What to build

1. Extend `AzureInventoryRbacDataPlaneRoleMap.Resolve` with **exact** built-in names only (OrdinalIgnoreCase). Do not substring-match “Contributor”. Minimum:

   | Role | Permission |
   |---|---|
   | Azure Service Bus Data Receiver | Read |
   | Azure Service Bus Data Sender | Write |
   | Azure Service Bus Data Owner | ReadAndWrite |
   | Azure Event Hubs Data Receiver | Read |
   | Azure Event Hubs Data Sender | Write |
   | Azure Event Hubs Data Owner | ReadAndWrite |

   Unknown still `None`. Tests for a typo / `Contributor` on a namespace **not** listed → None (existing Contributor mapping stays for the built-in *subscription* Contributor — do not change that row except if tests already lock it).

2. When emitting `appAuthorizedAccess`, if the design from SN-PE-01 allows direction overlays:
   - Read-only → diagram label **May read** (humanizer) while association type stays `appAuthorizedAccess` **or** store direction in edge properties — pick one; do **not** create a second associationType unless tests are clearer that way.
   - Write-only → **May write**.
   - ReadAndWrite / existing SQL DB Contributor path → keep **May access** (no fake ADF Writes to).
3. Scope still must not explode: subscription-scoped Sender → `rbac-scope-too-broad`, no per-queue fan-out (AX-DE-03 rule).
4. Tests:
   - Function MI + `Azure Service Bus Data Sender` on a topic ARM id in snapshot → one Function→topic authorized edge; Data Flow (SN-PE-03) includes Function (Application) and topic (Storage).
   - Receiver-only → May read, not Writes to.
   - Namespace-only inventory without role match → children may show as Storage nodes if already in snapshot, **zero** invented producer arrows.
   - Event Hub capture edge still DeclaredMovement (regression of AX-DE-13), separate from RBAC.

## Acceptance criteria

- No Event Grid–style `serviceBusToDestination` collection.
- No keys / authorization rules persisted.
- Data Flow does not show a producer merely because a queue exists.

## Constraints

- Do **not** add a new ZIP companion.
- Do **not** call Graph.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~RbacDataPlaneRoleMap'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AuthorizedAccess'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Sender/Receiver roles produce authorized Data Flow edges; a bare namespace does not.
