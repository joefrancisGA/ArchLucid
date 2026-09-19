# SN-RT-05 — RBAC data-plane allowlist (Option A)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option A.** **Depends on:** SN-PE-05 role-map pattern. **Do not** implement SN-RT-06–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Map additional **exact** built-in Azure roles to `AzureInventoryDerivedDataPlanePermission` so `appAuthorizedAccess` fires for queue, OpenAI, Search, and Communication — roles ArchLucid Terraform actually assigns.

## Why

`AzureInventoryRbacDataPlaneRoleMap` knows Blob, KV Secrets User, SQL DB Contributor, Service Bus/Event Hub (SN-PE-05). It returns `None` for:

- Storage Queue Data Message Sender / Processor
- Cognitive Services OpenAI User
- Search Index Data Contributor / Search Service Contributor
- Communication / Email contributor roles used by ACS

Those assignments exist in `infra/terraform-container-apps` and never become Data Flow **May access**.

## Context

- `ArchLucid.Core/InfraEvidence/AzureInventoryRbacDataPlaneRoleMap.cs`
- `ArchLucid.Core.Tests/InfraEvidence/AzureInventoryRbacDataPlaneRoleMapTests.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppAuthorizedAccessEdgeMapper.cs`
- SN-PE-05 (do not regress SB/EH rows)

## What to build

1. Exact OrdinalIgnoreCase names only. Minimum:

   | Role | Permission |
   |------|------------|
   | Storage Queue Data Message Sender | Write |
   | Storage Queue Data Message Processor | Read |
   | Storage Queue Data Contributor | ReadAndWrite |
   | Cognitive Services OpenAI User | Write |
   | Search Index Data Contributor | ReadAndWrite |
   | Search Index Data Reader | Read |
   | AcrPull | **None** (image pull — not data plane for Diagram 3) |

   Add ACS email contributor **only** if the built-in name is verified in Terraform (`Azure Communication Services` role strings). If uncertain, skip ACS and add a test that unknown ACS-like names stay `None`.

2. Unknown still `None`. Do not substring-match `Contributor`.
3. Tests: each new row; typo → None; `AcrPull` → None; existing Blob/KV/SQL/SB rows unchanged.
4. Do **not** re-collect `role-assignments.json`.

## Acceptance criteria

With a fixture assignment `Storage Blob Data Contributor` (already) **and** `Storage Queue Data Message Sender` on the same storage account, mapper emits authorized access. OpenAI User on a Cognitive account emits authorized access **when** SN-RT-04 left the node eligible (if 04 not merged, still emit the relationship; compile may drop the node until 04).

## Constraints

- Working-tree check. Do **not** promote RBAC to ObservedFact.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~RbacDataPlaneRoleMap'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AppAuthorizedAccess'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Allowlist tests pass. AcrPull stays None. No new collector.
