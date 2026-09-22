# IE-ID-02 — Identity-mode mermaid contract from inventory snapshots

**Wave:** inventory-diagram Identity (**IE-ID**). **Depends on:** **IE-ID-01**. **Do not** implement flatten here (01) or viewport collapse (03).

Do not implement from the wave index. Implement only *What to build*.

## Goal

`GET` mermaid `mode=identity` and mermaid/preview Identity row must include inventory user-assigned identities with non-empty Mermaid node lines. After IE-ID-01, a sparse many-RG identity snapshot must be Succeeded (or Partitioned only for true IE-17 size), with **no** `subgraph` keyword in the Identity mermaid.

Today `InfraEvidenceSnapshotMermaidServiceTests` assert Network on VNet snapshots. Identity can stay empty or nested and still “pass.”

## Why

Owner snapshot had 18 Identity nodes and a green Succeeded chip. There is still no test that `mode=identity` mermaid contains those labels or that sparse Identity dropped swimlanes. Without this contract, IE-ID-01 can regress the same way Network did before IE-ND-02.

## Context

- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs`
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` (`Network_mode_renders_mermaid_for_virtual_network_snapshot`, `Network_mode_preview_reports_nodes_for_virtual_network_snapshot`, `Network_mode_excludes_storage_accounts_from_mermaid`)
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs` (`identity` → `DiagramMode.Identity`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (mode value `identity`)
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs`
- Index: `.cursor/prompts/inventory-diagram-identity-00-index.md`

## What to build

1. Application.Tests: snapshot of ≥3 (and a sparse 12-RG sibling) `Microsoft.ManagedIdentity/userAssignedIdentities`. Distinct `ResourceGroup` per resource on the sparse fixture. Do **not** pre-stamp `GraphNode.Category`. Resource type is enough.
2. `TryGetMermaidAsync` `mode=identity`:
   - Succeeded or Partitioned; `NodeCount` equals the identity resource count.
   - Mermaid contains `flowchart TD` and each resource label (last ARM segment).
   - Sparse 12-RG fixture: mermaid does **not** contain `subgraph` (requires IE-ID-01 on the branch; rebase if missing).
3. Preview: Modes row `Mode=="identity"` has `NodeCount > 0` on that snapshot. Status is not Failed. Do not hide a zero-node Identity behind a green Executive preview.
4. Mixed snapshot: user-assigned identities + storage accounts → Identity mermaid includes the MI labels and excludes storage account labels; Data/full still include storage.
5. Keep existing IE-HOTFIX / Network tests (null ARM, duplicate `CloudResourceId`, preview continues when one mode throws).

## Acceptance criteria

- A listable snapshot of user-assigned identities yields Identity mermaid with those labels.
- Preview Identity metrics cannot be 0 nodes while the same snapshot’s graph resolver lists `Microsoft.ManagedIdentity/userAssignedIdentities`.
- Sparse 12-RG Identity mermaid has no `subgraph` keyword once IE-ID-01 is present.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** re-do IE-ID-01 flatten unless it is missing on this branch (rebase/merge it).
- **Do not** change UI too-large copy or IDV viewport (IE-ID-03).
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

- Identity-mode mermaid for an MI-only snapshot contains those labels and matching `NodeCount`.
- Sparse many-RG Identity mermaid is flat (`flowchart TD`, no `subgraph`) after IE-ID-01.
