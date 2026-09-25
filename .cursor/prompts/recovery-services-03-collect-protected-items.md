# RSV-03 — Collect who a Recovery Services vault protects

**Wave:** Recovery Services vaults (**RSV**). **Depends on:** RSV-02. **Do not** add the viewer checkbox. **Do not** implement RSV-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

For each Recovery Services vault in a hosted inventory, read Azure Backup protected items and Site Recovery replication-protected items. Persist a `PROTECTS` edge only when the item names that vault and a source resource id present in the same snapshot. Record a coverage gap when the read fails. Business continuity then draws those edges and replaces the RSV-02 “not collected” caption.

## Why

The vault ARM resource does not list its workloads. Backup and Site Recovery keep that list on child APIs. Collocation in `AzureInventorySnapshotSameResourceGroupEdgeHydrator` would claim protection the snapshot does not prove.

## Context

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` — GET-only, paginated, per-resource fan-out already exists for diagnostic settings. Follow that bound: one vault, one list, stop at `MaxPaginationRequests`.
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs` — hydrators run after captured relationships
- `ArchLucid.Application/InfraEvidence/AuditEvidence/ResilienceAuditEvidenceSelector.cs` — already names the vault type; do not change its evidence contract in this prompt
- Azure Backup list: `GET {vaultId}/backupProtectedItems?api-version=2023-04-01`
- Site Recovery list: `GET {vaultId}/replicationProtectedItems?api-version=2021-11-01`
- Confirm both API versions against current Microsoft REST docs before coding. If a version in this prompt is retired, stop and report the replacement. Do not guess a version.

## What to build

1. Add association type `recoveryServicesProtects`. Graph edge type `PROTECTS`. Inference source `inventory-recovery-services-protects`. Provenance `ObservedFact`. From-kind is the vault. To-kind is the protected resource. Label on the diagram edge is `backs up` when the item is a backup protected item.

2. Add association type `recoveryServicesReplicates`. Same edge type `PROTECTS`. Inference source `inventory-recovery-services-replicates`. Provenance `ObservedFact`. Diagram label `replicates`. Emit it only when the replication item includes a source resource id that resolves to a snapshot node. If the item has a target region or target resource id, store that as edge properties. Do not invent a second node for a target that is not in the snapshot.

3. Fan out only for resources whose type is `Microsoft.RecoveryServices/vaults`. A 403 or 404 on one vault sets a snapshot warning that names the vault id and the API (`backup` or `siteRecovery`) and continues to the next vault. Do not synthesize edges for that vault. Do not treat HTTP failure as “zero items protected.”

4. Map `properties.sourceResourceId` (backup) and the Site Recovery source ARM id field documented for the chosen API version. Ignore an item whose source id is blank or not in the snapshot. Do not fall back to resource-group membership, disk name, or VM name similarity.

5. Hydrate missing edges in a new `AzureInventorySnapshotRecoveryServicesEdgeHydrator` called from `AzureInventorySnapshotGraphResolver.BuildGraph`. Skip when an identical vault→source→edge-type key already exists.

6. Business continuity compile:
   - Include the vault and any snapshot node that is the target of a `PROTECTS` edge from a vault.
   - Draw only those `PROTECTS` edges.
   - When every vault read succeeded, caption: `Lines are backup or replication items collected from the vault. Resources with no line have no collected protection item in this snapshot.`
   - When any vault read failed, keep the vault, draw edges only for vaults that succeeded, and caption: `Protection coverage is incomplete. A vault with no line may still protect resources this snapshot could not read.`
   - Remove the RSV-02 sentence `Protection coverage is not collected for this snapshot.`

7. Tests with canned JSON, no live Azure:
   - Backup item whose `sourceResourceId` is a VM in the snapshot → one `backs up` edge, vault to VM.
   - Backup item pointing at a resource id absent from the snapshot → no edge.
   - Two VMs in the vault's resource group and no protected items → no edges.
   - 403 on backup list → no edges for that vault, gap recorded, Site Recovery list for the same vault still attempted.
   - Replication item with a source VM and a target region → one `replicates` edge and the region stored on the edge. No extra node for the region.

## Acceptance criteria

- `AzureInventorySnapshotSameResourceGroupEdgeHydrator` does not grow a vault method.
- Full subscription still omits the vault.
- Business continuity shows the VM only because a collected item cites it.
- A gap is distinguishable from a successful empty list.

## Constraints

- GET only. No PUT, POST, or backup-job triggers.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj --filter FullyQualifiedName~RecoveryServices
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~RecoveryServices
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~BusinessContinuity
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if a command runs longer than 15s. No full-solution build. No live subscription call.
