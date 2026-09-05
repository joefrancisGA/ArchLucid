using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDiffComparerTests
{
    [Fact]
    public void Compare_identical_snapshots_produces_zero_changes()
    {
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            snapshotAId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "prod");

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshot, snapshot, snapshotAId, snapshotBId);

        changes.Should().BeEmpty();
    }

    [Fact]
    public void Compare_detects_resource_added_removed_tag_and_sku_changes()
    {
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(
            snapshotAId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "prod",
            sku: "Standard_LRS");

        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "staging",
            sku: "Standard_GRS",
            extraResourceArmId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm2");

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, snapshotAId, snapshotBId);

        changes.Should().Contain(c => c.ChangeType == AzureInventoryChangeType.ResourceAdded);
        changes.Should().Contain(c => c.ChangeType == AzureInventoryChangeType.TagChanged);
        changes.Should().Contain(c => c.ChangeType == AzureInventoryChangeType.SkuChanged);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        string region,
        string tagKey,
        string tagValue,
        string? sku = null,
        string? extraResourceArmId = null)
    {
        List<AzureInventoryResourcePropertyReadModel> properties = [];

        if (!string.IsNullOrWhiteSpace(sku))
        {
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = resourceRowId,
                PropertyKey = "sku",
                PropertyValue = sku,
            });
        }

        List<AzureInventoryResourceRecord> resources =
        [
            new AzureInventoryResourceRecord
            {
                ResourceRowId = resourceRowId,
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                AzureResourceId = armId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Region = region,
            },
        ];

        if (!string.IsNullOrWhiteSpace(extraResourceArmId))
        {
            resources.Add(new AzureInventoryResourceRecord
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                AzureResourceId = extraResourceArmId,
                ResourceType = "Microsoft.Compute/virtualMachines",
                Region = region,
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
            Properties = properties,
            Tags =
            [
                new AzureInventoryTagReadModel
                {
                    ResourceRowId = resourceRowId,
                    TagKey = tagKey,
                    TagValue = tagValue,
                },
            ],
        };
    }
}
