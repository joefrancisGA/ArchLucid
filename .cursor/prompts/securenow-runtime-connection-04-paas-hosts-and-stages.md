# SN-RT-04 — PaaS host index and Data Flow stages (Option A)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option A.** **Depends on:** SN-RT-03 preferred (host index). **Do not** implement SN-RT-05–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When Azure OpenAI, AI Search, or Cognitive Services (Content Safety) **exist in the snapshot**, they get (1) hostname index entries so env URLs resolve, and (2) Data Flow **stages** so they are not dropped by `ApplyDataFlowFilter`.

## Why

CD wires `AzureOpenAI__Endpoint`, `Retrieval__AzureSearch__Endpoint`, `ArchLucid__ContentSafety__Endpoint`. `ExtractKnownHosts` knows storage/SQL/KV/Synapse/Cosmos/Postgres — not `openai.azure.com` / `search.windows.net` / `cognitiveservices.azure.com`. `AzureInventoryDataFlowStageResolver` returns null for `Microsoft.CognitiveServices/*` and `Microsoft.Search/*`, so nodes vanish on Diagram 3.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageResolver.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowStageResolver.cs` (keep both in sync if both exist)
- SN-DF-02 / SN-PE-02 stage names (`Application` / `Storage` / `Transform` / `Consumer`)

## What to build

1. `ExtractKnownHosts`:
   - Cognitive account custom subdomain / name → `{name}.openai.azure.com` **and** `{name}.cognitiveservices.azure.com` when type is `Microsoft.CognitiveServices/accounts` (do not guess which SKU; emit both hosts if unique).
   - `Microsoft.Search/searchServices` → `{name}.search.windows.net`.
2. Stage resolver (only if ARM type present):
   - OpenAI / Content Safety accounts → **Transform** (or Application if tests are clearer that OpenAI is an app dependency — **pick Transform** for model calls; document in comment).
   - Search → **Storage** (index is a store).
3. Do **not** mint nodes when the ARM type is absent.
4. Tests:
   - Snapshot with `archlucid-dev-contentsafety` Cognitive account + env host match → unique host index hit.
   - Snapshot without Cognitive type → no synthetic node.
   - Data Flow filter keeps Search/Cognitive nodes when type present.
   - Network mode unchanged (these types were never network).

## Acceptance criteria

Env URL → ARM id works for unique OpenAI/Search/CS names. Data Flow shows those nodes. Empty when missing from inventory.

## Constraints

- Working-tree check. Do **not** add RBAC names (SN-RT-05). Do **not** collect new ARM types beyond host/stage mapping of existing inventory rows.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~DataFlowStageResolver|FullyQualifiedName~AdfLinkedServiceTargetResolver'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlow'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Host index + stage tests pass. No minted PaaS boxes.
