using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryRecoveryServicesEdgeMapperTests
{
    private const string VaultId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";
    private const string VmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";
    private const string OtherVmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/other-vm";

    [Fact]
    public void MapProtectedItems_emits_protects_edge_for_backup_item_in_snapshot()
    {
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            [
                new AzureInventoryRecoveryServicesProtectedItemRow
                {
                    VaultResourceId = VaultId,
                    ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
                    SourceResourceId = VmId,
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                },
            ],
            VisibleArmIds(VmId),
            relationships,
            keys,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].RelationshipType.Should().Be("PROTECTS");
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryRecoveryServicesProtects);
        warnings.Should().BeEmpty();
    }

    [Fact]
    public void MapProtectedItems_skips_backup_item_when_source_not_in_snapshot()
    {
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            [
                new AzureInventoryRecoveryServicesProtectedItemRow
                {
                    VaultResourceId = VaultId,
                    ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
                    SourceResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/missing",
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                },
            ],
            VisibleArmIds(VmId),
            relationships,
            keys,
            warnings);

        relationships.Should().BeEmpty();
    }

    [Fact]
    public void MapProtectedItems_emits_no_edges_when_vault_has_no_succeeded_items()
    {
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            [],
            VisibleArmIds(VmId, OtherVmId),
            relationships,
            keys,
            warnings);

        relationships.Should().BeEmpty();
    }

    [Fact]
    public void MapProtectedItems_records_warning_when_backup_list_failed()
    {
        string warningCode =
            $"{AzureInventoryRecoveryServicesCompletenessWarningCodes.BackupListFailedPrefix}{VaultId}|backup";
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            [
                AzureInventoryRecoveryServicesProtectedItemSanitizer.BuildVaultListFailureRow(
                    VaultId,
                    AzureInventoryRecoveryServices.BackupItemKind,
                    warningCode),
            ],
            VisibleArmIds(VmId),
            relationships,
            keys,
            warnings);

        relationships.Should().BeEmpty();
        warnings.Should().ContainSingle(warningCode);
    }

    [Fact]
    public void MapProtectedItems_emits_replicate_edge_with_replication_inference_source()
    {
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            [
                new AzureInventoryRecoveryServicesProtectedItemRow
                {
                    VaultResourceId = VaultId,
                    ItemKind = AzureInventoryRecoveryServices.ReplicationItemKind,
                    SourceResourceId = VmId,
                    TargetRegion = "West US 2",
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                },
            ],
            VisibleArmIds(VmId),
            relationships,
            keys,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates);
    }

    private static HashSet<string> VisibleArmIds(params string[] armIds)
    {
        return armIds
            .Select(ArmResourceIdNormalizer.Normalize)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
