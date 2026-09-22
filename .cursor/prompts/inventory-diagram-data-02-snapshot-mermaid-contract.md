# IE-DD-02 — Data-mode mermaid contract from inventory snapshots

**Wave:** inventory-diagram Data (**IE-DD**). **Depends on:** **IE-DD-01**. **Do not** implement flatten/validator (03) or Failed UX (04).

Do not implement from the wave index. Implement only *What to build*.

## Goal

`GET` mermaid `mode=data` and mermaid/preview Data row must include inventory storage accounts and (after IE-DD-01) SQL/Cosmos data-plane resources with non-empty Mermaid node lines. Status must not be Failed for those snapshots. Sparse many-RG Data mermaid must have **no** `subgraph` keyword (Data flatten is already on trunk).

Today `InfraEvidenceSnapshotMermaidServiceTests` assert Network and Identity. Data can stay empty or Failed and still “pass.”

## Why

Owner snapshot had 38 Data nodes and a **Failed** chip. There is still no test that `mode=data` mermaid contains storage/SQL labels or that sparse Data dropped swimlanes. Without this contract, IE-DD-01 can regress the same way Network did before IE-ND-02.

## Context

- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs`
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` (`Network_mode_renders_mermaid_for_virtual_network_snapshot`, `Identity_mode_renders_mermaid_for_managed_identity_snapshot`, `Identity_mode_excludes_storage_accounts_from_mermaid`)
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs` (`data` → `DiagramMode.Data`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (mode value `data`)
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs`
- Index: `.cursor/prompts/inventory-diagram-data-00-index.md`

## What to build

1. Application.Tests: snapshot of ≥3 `Microsoft.Storage/storageAccounts` **and** a sibling with `Microsoft.Sql/servers`. Distinct `ResourceGroup` per resource on a sparse 12-RG storage fixture. Do **not** pre-stamp `GraphNode.Category`. Resource type is enough.
2. `TryGetMermaidAsync` `mode=data`:
   - Succeeded or Partitioned; **never Failed** on these fixtures.
   - `NodeCount` equals the data-plane resource count (storage + SQL after IE-DD-01).
   - Mermaid contains `flowchart TD` and each resource label (last ARM segment).
   - Sparse 12-RG storage: mermaid does **not** contain `subgraph`.
3. Preview: Modes row `Mode=="data"` has `NodeCount > 0` on that snapshot. Status is not Failed. Do not hide a zero-node Data behind a green Executive preview.
4. Mixed snapshot: storage + SQL + VNets + user-assigned identities → Data includes storage/SQL labels, excludes VNet and MI labels; Network/Identity still exclude storage.
5. Keep existing IE-HOTFIX / Network / Identity tests.

## Acceptance criteria

- A listable snapshot of storage accounts (and SQL after 01) yields Data mermaid with those labels.
- Preview Data metrics cannot be 0 nodes while the same snapshot’s graph resolver lists `Microsoft.Storage/storageAccounts`.
- Sparse 12-RG Data mermaid has no `subgraph` keyword.
- Data preview/render status is not Failed on these fixtures.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** re-do IE-DD-01 unless the helper is missing on this branch (rebase/merge it).
- **Do not** change UI too-large copy or Failed StatusTag (IE-DD-04).
- **Do not** statically import mermaid. **Do not** lower IE-17 thresholds.
- TB-645. Sentence case.
- Verification:
  ```bash
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
  pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
  ```
  Heartbeat every 8s if >15s. No full-solution build, no `npm ci`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- Data-mode mermaid for a storage+SQL snapshot contains those labels and matching `NodeCount`.
- Sparse many-RG Data mermaid is flat (`flowchart TD`, no `subgraph`).
- Data preview is not Failed.
