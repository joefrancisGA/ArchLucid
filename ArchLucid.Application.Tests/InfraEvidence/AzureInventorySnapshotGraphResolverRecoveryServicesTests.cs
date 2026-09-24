using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverRecoveryServicesTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_backup_edge_from_vault_property()
    {
        Guid vaultRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid vmRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string vaultId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";
        const string vmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";

        List<AzureInventoryRecoveryServicesProtectedItemRow> protectedItems =
        [
            new()
            {
                VaultResourceId = vaultId,
                ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
                SourceResourceId = vmId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(vaultRow, vaultId, AzureInventoryRecoveryServices.VaultResourceType),
                Resource(vmRow, vmId, "Microsoft.Compute/virtualMachines"),
            ],
            Properties =
            [
                Property(
                    vaultRow,
                    AzureInventoryRecoveryServices.ProtectedItemsPropertyKey,
                    JsonSerializer.Serialize(protectedItems)),
            ],
        };

        AzureInventorySnapshotGraphResolveResult resolved = await ResolveAsync(snapshot);

        resolved.Succeeded.Should().BeTrue();
        GraphEdge edge = resolved.Graph!.Edges.Should().ContainSingle(candidate =>
            candidate.EdgeType == GraphEdgeTypes.Protects).Subject;
        edge.Label.Should().Be(AzureInventoryRecoveryServices.BackupEdgeLabel);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryRecoveryServicesProtects);
    }

    [Fact]
    public async Task TryResolveGraphAsync_skips_backup_item_when_source_not_in_snapshot()
    {
        Guid vaultRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        const string vaultId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";

        List<AzureInventoryRecoveryServicesProtectedItemRow> protectedItems =
        [
            new()
            {
                VaultResourceId = vaultId,
                ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
                SourceResourceId =
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/missing",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [Resource(vaultRow, vaultId, AzureInventoryRecoveryServices.VaultResourceType)],
            Properties =
            [
                Property(
                    vaultRow,
                    AzureInventoryRecoveryServices.ProtectedItemsPropertyKey,
                    JsonSerializer.Serialize(protectedItems)),
            ],
        };

        AzureInventorySnapshotGraphResolveResult resolved = await ResolveAsync(snapshot);

        resolved.Graph!.Edges.Should().BeEmpty();
    }

    [Fact]
    public async Task BusinessContinuity_compile_includes_vault_target_and_collected_edge()
    {
        Guid vaultRow = Guid.Parse("11111111-1111-4000-8000-000000000004");
        Guid vmRow = Guid.Parse("11111111-1111-4000-8000-000000000005");
        const string vaultId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";
        const string vmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";

        AzureInventorySnapshotGraphResolveResult resolved = await ResolveAsync(new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(vaultRow, vaultId, AzureInventoryRecoveryServices.VaultResourceType),
                Resource(vmRow, vmId, "Microsoft.Compute/virtualMachines"),
            ],
            Properties =
            [
                Property(
                    vaultRow,
                    AzureInventoryRecoveryServices.ProtectedItemsPropertyKey,
                    JsonSerializer.Serialize(
                        new List<AzureInventoryRecoveryServicesProtectedItemRow>
                        {
                            new()
                            {
                                VaultResourceId = vaultId,
                                ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
                                SourceResourceId = vmId,
                                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                            },
                        })),
            ],
        });

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            resolved.Graph!,
            DiagramMode.BusinessContinuity,
            new DiagramAstCompileOptions { RecoveryServicesCollectionIncomplete = false });

        ast.Nodes.Should().Contain(node => node.Label == "backup-vault");
        ast.Nodes.Should().Contain(node => node.Label == "app-vm");
        ast.Edges.Should().Contain(edge => edge.Label == AzureInventoryRecoveryServices.BackupEdgeLabel);
        ast.CaptionLines.Should().ContainSingle(line =>
            line.Contains("Lines are backup or replication items collected from the vault", StringComparison.Ordinal));
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext { TenantId = TenantId },
            SnapshotId);
    }

    private static AzureInventoryResourceRecord Resource(Guid rowId, string armId, string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = rowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = armId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }

    private static AzureInventoryResourcePropertyReadModel Property(Guid rowId, string key, string value)
    {
        return new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = rowId,
            PropertyKey = key,
            PropertyValue = value,
        };
    }
}
