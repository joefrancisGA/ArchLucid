# SN-PE-02 — Application and messaging stages

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-01 (can land if 01 helper is unused). **Do not** implement SN-PE-03–07.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Extend `AzureInventoryDataFlowStageResolver` so App Service / Function / Container App, Event Grid, Service Bus, Event Hub, Logic Apps, and Key Vault resolve to stages. Network types stay **null**. Do not mint nodes.

## Why

SN-DF-02 omitted these types so Data Flow would not dump the ARM forest. SN-PE-03 will include evidence edges that need Application and messaging **seats**. Unknown ARM must still omit (VMs stay off Data Flow unless a later prompt proves a family edge — **this prompt does not special-case VMs**).

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §6
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageResolver.cs`
- `AzureInventoryDataFlowStageNames` (add `Application` to **ordered** stages)
- SN-DF-02 tests — extend; do not fork a second resolver

## What to build

1. Add stage constant **`Application`**. Ordered stages become: Source, Application, Ingestion, Storage, Transform, Consumer. Insert Application **after** Source. Update any OrderedStages tests.
2. Provider-prefix mapping (OrdinalIgnoreCase; no `Contains("/sql")` copies):

   | Prefix / type | Stage |
   |---|---|
   | `Microsoft.Web/sites` (App Service / Function) | Application |
   | `Microsoft.App/containerApps` | Application |
   | `Microsoft.EventGrid/` topics, domains, systemTopics (not subscriptions-as-nodes unless already inventoried) | Ingestion |
   | `Microsoft.Logic/` workflows | Ingestion |
   | `Microsoft.ServiceBus/` (namespaces, queues, topics) | Storage |
   | `Microsoft.EventHub/` (namespaces, eventhubs) | Storage |
   | `Microsoft.KeyVault/vaults` | Storage |
   | Existing Data Factory → Ingestion, SQL/Cosmos/Storage → Storage, Synapse/Databricks → Transform, Power BI/Fabric → Consumer | unchanged |
   | `Microsoft.Network/` | still null |
   | `Microsoft.Compute/virtualMachines` | still null |

3. External source flag still wins → Source.
4. Tests:
   - Table of ARM types → expected stage (include `Microsoft.Sql/servers` → Storage).
   - `Microsoft.Web/sites` → Application.
   - `Microsoft.EventGrid/topics` → Ingestion.
   - `Microsoft.ServiceBus/namespaces/topics` → Storage.
   - `Microsoft.Network/privateEndpoints` → null.
   - VM → null.
   - OrderedStages index: Application immediately after Source.

## Acceptance criteria

- Single resolver; SN-PE-03 must not copy prefix checks.
- No fake Power BI. No Customer stage.

## Constraints

- Do **not** change `DiagramMode` or the edge filter (SN-PE-03).
- Do **not** change Network compile.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryDataFlowStage'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph/ArchLucid.KnowledgeGraph.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Stage table in the design note §6 is locked by tests, including Application after Source.
