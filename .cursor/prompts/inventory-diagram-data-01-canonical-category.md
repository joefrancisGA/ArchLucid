# IE-DD-01 — Canonical Azure data/storage topology category

**Wave:** inventory-diagram Data (**IE-DD**). **Depends on:** IE-16, **IE-ND-01** (network provider prefix already on trunk). **Do not** implement IE-DD-02, IE-DD-03, or IE-DD-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Azure inventory topology category must classify `Microsoft.Sql/*`, `Microsoft.DocumentDB/*`, and `Microsoft.DBfor*` as `GraphTopologyCategories.Data`, and keep `Microsoft.Storage/*` as `Storage`, so Inventory diagrams **Data** mode includes SQL, Cosmos accounts, and flexible PostgreSQL/MySQL — not only types whose ARM segment happens to contain `"/storage"`.

## Why

Owner screenshot: Inventory diagrams → **Data**, Render **failed**, 38 nodes / 70 edges / 38 subgraphs. Those 38 nodes are the storage slice that already matches. SQL/Cosmos/DBfor* never enter Data mode because `AzureInventoryTopologyCategory.Resolve` uses `Contains("/sql")`, `Contains("/documentdb")`, and `Contains("/dbfor")`.

`Microsoft.Sql/servers` has `.Sql/` not `/sql`. Same class as IE-ND-01 `Contains("/network")` vs `Microsoft.Network/virtualNetworks`. `DataAuditEvidenceSelector` already includes Storage / Sql / DocumentDB. Diagram category is weaker than the audit selector.

Do **not** change `flowchart TD` to LR. Do not flatten here.

## Context

- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs`
- `ArchLucid.KnowledgeGraph.Tests/Inventory/AzureInventoryTopologyCategoryTests.cs` (has Storage + Network; **no SQL/Cosmos/DBfor rows**)
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs`
- `ArchLucid.Application/InfraEvidence/AuditEvidence/DataAuditEvidenceSelector.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (`DiagramMode.Data` → Data + Storage)
- Index: `.cursor/prompts/inventory-diagram-data-00-index.md`
- Wave doc: `docs/architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`

## What to build

1. Extend `AzureInventoryTopologyCategory.Resolve` (existing file — **do not** add a second helper):
   - **Storage** when `resourceType` contains `Microsoft.Storage/` (OrdinalIgnoreCase), including nested `blobServices` / `containers`.
   - **Data** when `resourceType` contains `Microsoft.Sql/` or `Microsoft.DocumentDB/` or `Microsoft.DBfor` (covers `DBforPostgreSQL` / `DBforMySQL` / `DBforMariaDB`).
   - Keep `Microsoft.Network/` as network. Do **not** keep `Contains("/sql")` as the primary SQL rule — it misses `Microsoft.Sql/servers` and accidentally classifies `.../sqlDatabases` via `/sqlDatabases`.
   - Blank/null → existing compute default.
   - Do **not** add Key Vault, Redis, Synapse, or Event Hub to Data in this prompt.
2. Resolver stamp + classifier fallback both call the helper. If `Category` is already a known `GraphTopologyCategories` value, still allow ARM-type override when ARM type is Sql / DocumentDB / DBfor / Storage but the stamped category is compute — same idea as the network override. Short comment for a two-year developer.
3. Tests (must fail on current master, pass after):
   - Theory/table: ARM types in the wave-doc diagnosis table → expected category **without** setting `GraphNode.Category`.
   - Negative: `virtualMachines` stay compute; `virtualNetworks` stay network; `userAssignedIdentities` stay identity.
   - `DiagramAstFromGraphCompiler` Data mode on a SQL-server-only graph (empty Category, `arm.type` only) includes those nodes. Storage-only still included. VM-only Data compile is empty.
4. Do not pre-stamp `Category = Data` on SQL nodes in these new tests.

## Acceptance criteria

- `Microsoft.Sql/servers` and `Microsoft.DocumentDB/databaseAccounts` stamp category **data** without the test setting Category.
- `Microsoft.Storage/storageAccounts` stays **storage**.
- Data mode compile of a SQL-only graph (category derived) includes those nodes.
- Network / Identity category tests stay green.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** change flatten, UI viewer, or IE-17 thresholds.
- **Do not** statically import mermaid.
- TB-645. Sentence case.
- Verification:
  ```bash
  dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryTopologyCategory'
  dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'
  pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
  ```
  Heartbeat every 8s if >15s. No full-solution build, no dev server, no `npm ci`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- A SQL-server-only inventory graph (category derived from `arm.type`) compiles in Data mode with those node labels.
- Storage accounts remain in Data mode via Storage category.
- The `/sql` / `/documentdb` / `/dbfor` primary rules are gone.
