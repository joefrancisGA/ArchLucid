# DFV-11 — Keep the ADF link type and host on the snapshot

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-08, DFV-09, DFV-12, or DFV-13 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-01 through DFV-07 are already there. Do not redo the icon map or the repairer field copy.

## Goal

After a new inventory capture, an external ADF linked-service card still knows its connector type, target host, factory, integration runtime, and whether the host is in Key Vault. The forest canvas can read those facts when it rebuilds the graph from the saved snapshot.

## Why

`AzureInventoryAdfLinkedServiceEdgeMapper` resolves each linked-service row while the capture is materialized. An unresolved row becomes the relationship endpoint `adf-external:{factoryArmId}|{name}`. `AzureInventoryResourceRelationshipWrite` stores the two ids and the relationship type. It does not store `LinkedServiceType`, `TargetHost`, `FactoryResourceId`, `IntegrationRuntimeName`, or `KeyVaultResourceId`.

`AzureInventorySnapshotGraphResolver` later calls `AzureInventorySnapshotExternalSourceNodeHydrator.EnsureExternalSourceNode`, which calls `CreateGraphNode` with `linkedServiceType: null` and `targetHost: null`. The card is a `TopologyResource` with the generic pictogram. DFV-03, DFV-05, and DFV-07 never see the type.

`AzureInventoryAdfLinkedServiceRow` already holds the safe fields at materialization. This session saves those fields and puts them back on the graph node. It does not draw new caption lines. DFV-08 paints them.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceRow.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfExternalSourceNodeFactory.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAdfLinkedServiceEdgeMapper.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotExternalSourceNodeHydrator.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Materialize.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Read.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Delete.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IAzureInventorySnapshotRepository.cs`
- `ArchLucid.Persistence/Migrations/398_AzureInventorySnapshotCompletenessWarnings.sql`

## What to build

1. Branch `dfv/11-persist-linked-service-identity` from current `master`.
2. Add the next numbered migration after the highest file in `ArchLucid.Persistence/Migrations`, plus a matching `Rollback/R{n}_*.sql`. Mirror the table in `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql` and `ArchLucid.Persistence/Scripts/ArchLucid.sql` the way `AzureInventoryResourceRelationships` is mirrored there. Create `dbo.AzureInventoryAdfExternalSources` with:
   - `ExternalSourceRowId`, `SnapshotId`, `TenantId`
   - `ExternalNodeKey` (`adf-external:…`, NVARCHAR(1024))
   - `LinkedServiceName` (NVARCHAR(256))
   - `LinkedServiceType` (NVARCHAR(128))
   - `TargetHost` (NVARCHAR(256), null)
   - `FactoryResourceId` (NVARCHAR(1024))
   - `IntegrationRuntimeName` (NVARCHAR(256), null)
   - `HostInKeyVault` (bit, default 0)
   - `KeyVaultResourceId` (NVARCHAR(1024), null)
   - Unique `(TenantId, SnapshotId, ExternalNodeKey)`
   - The same tenant and snapshot indexes as `AzureInventoryResourceRelationships`
3. There is no column for a connection string, secret, password, or account key.
4. When the linked-service mapper creates an external endpoint, also emit an `AzureInventoryAdfExternalSourceWrite` for that row. Carry the list on `AzureInventorySecurityEdgeMaterializeResult` and on `AzureInventorySnapshotMaterializeWriteRequest`. Insert it in the existing materialize transaction. Load it with the snapshot detail. Delete it by `TenantId` and `SnapshotId` before the snapshot row is deleted.
5. Persist `row.TargetHost` only when it is a host. Reject a value that contains `;`, whitespace, `Password`, `Pwd`, `AccountKey`, `SharedAccessSignature`, or `secret`. Leave `TargetHost` null in that case. Set `HostInKeyVault` when `KeyVaultResourceId` is present and `TargetHost` is empty. Store the Key Vault resource id. Do not store `secretName`.
6. Do not insert these rows into `AzureInventoryResources`. Do not change `ResourceCount`.
7. Include the new rows in the snapshot content hash so a later capture with a different host does not reuse the old hash.
8. `AzureInventorySnapshotGraphResolver` passes the saved rows into the hydrator. `EnsureExternalSourceNode` calls `CreateGraphNode` with the saved type and host. Also set these graph properties when they have values:
   - `arm.externalFactoryName` — the factory resource name, the last ARM segment
   - `arm.externalIntegrationRuntime`
   - `arm.externalHostInKeyVault` = `true` when the flag is set
9. A snapshot with no saved rows keeps today's null type and null host. Do not invent a host from the linked-service name.
10. Tests:
    - Materializing a linked-service row of type `Sftp`, host `files.partner.example`, factory `…/factories/adf-edw-hi-dev`, and runtime `selfHostedIr` writes one external-source row and no connection string.
    - A row whose host contains `Pwd=secret` stores a null host.
    - A row with a Key Vault resource id and no host stores `HostInKeyVault` and does not store a hostname.
    - Resolving a snapshot that has that SFTP row produces a graph node whose properties include `arm.externalLinkedServiceType` = `Sftp`, `arm.externalTargetHost` = `files.partner.example`, and `arm.externalFactoryName` = `adf-edw-hi-dev`.
    - A snapshot with no external-source rows still builds the external node from the relationship id.

## Acceptance criteria

- A new capture keeps type, host, factory, runtime, and the Key Vault flag for each external linked service.
- The graph node for that capture carries the type and host the icon resolver already reads.
- Resource count and the inventory resource list stay the same.
- No secret value is written to the table, the graph, or a log.
- Older snapshots still open.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Tenant-scoped reads, writes, and deletes filter on `TenantId` and `SnapshotId`, same as the relationship table.
- Do not paint caption lines. That is DFV-08.
- Do not retarget edges onto storage accounts. That is DFV-12.
- Do not read `connectionString`. That is DFV-09.
- Working-tree safety. Stage only the migration, rollback, repository, materializer, hydrator, and tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~ExternalSource|FullyQualifiedName~AdfLinked"
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj --filter FullyQualifiedName~AzureInventorySnapshot
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1. Skip a test project that does not exist and say which filter you ran.

## Done when

Tests pass. Tell the owner that `Hmd_HI_HAP_Non_Prod` will keep the generic cards until a new inventory capture. After that capture, restart the API and open Data flow. An SFTP or Blob linked service should no longer be a blank topology card: the graph has its type and host. Wait for that look before any commit. DFV-08 then paints factory, host, and `Host in Key Vault` on the card.
