using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectNeighborhoodExpanderTests
{
    private static readonly Guid StorageRg1Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid StorageRg2Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ManagedIdentityId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private const string StorageRg1Arm =
        "/subscriptions/sub/resourceGroups/rg1/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string StorageRg2Arm =
        "/subscriptions/sub/resourceGroups/rg2/providers/Microsoft.Storage/storageAccounts/sa2";
    private const string ManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg1/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker";

    [Fact]
    public void Expand_unrelated_rg_change_seeds_only_changed_resource()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        IReadOnlySet<Guid> seeds = SecureNowArchitectNeighborhoodExpander.Expand(
            snapshot,
            [
                new AzureInventoryChangeRecord
                {
                    ChangeId = Guid.NewGuid(),
                    ChangeType = AzureInventoryChangeType.NetworkExposureChanged,
                    CloudResourceId = StorageRg2Id,
                    AzureResourceId = StorageRg2Arm,
                },
            ]);

        seeds.Should().Contain(StorageRg2Id);
        seeds.Should().NotContain(StorageRg1Id);
    }

    [Fact]
    public void Expand_rbac_change_on_managed_identity_includes_one_hop_neighbor()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        IReadOnlySet<Guid> seeds = SecureNowArchitectNeighborhoodExpander.Expand(
            snapshot,
            [
                new AzureInventoryChangeRecord
                {
                    ChangeId = Guid.NewGuid(),
                    ChangeType = AzureInventoryChangeType.PermissionChanged,
                    CloudResourceId = ManagedIdentityId,
                    AzureResourceId = ManagedIdentityArm,
                },
            ]);

        seeds.Should().Contain(ManagedIdentityId);
        seeds.Should().Contain(StorageRg1Id);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot() =>
        new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    AzureResourceId = StorageRg1Arm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = StorageRg1Id,
                    ResourceGroup = "rg1",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    AzureResourceId = StorageRg2Arm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = StorageRg2Id,
                    ResourceGroup = "rg2",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    AzureResourceId = ManagedIdentityArm,
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                    CloudResourceId = ManagedIdentityId,
                    ResourceGroup = "rg1",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = ManagedIdentityArm,
                    ToAzureResourceId = StorageRg1Arm,
                    RelationshipType = "usesIdentity",
                },
            ],
        };
}
