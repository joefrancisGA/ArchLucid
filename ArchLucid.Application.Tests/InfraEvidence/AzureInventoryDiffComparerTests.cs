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

    [Fact]
    public void Compare_omits_never_show_solutions_and_virtual_network_links()
    {
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();
        string solutionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security";
        string linkArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(
            snapshotAId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "prod");

        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "prod",
            extraResourceArmId: solutionArmId,
            secondExtraResourceArmId: linkArmId);

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, snapshotAId, snapshotBId);

        changes.Should().NotContain(change =>
            change.AzureResourceId != null
            && (change.AzureResourceId.Contains("/solutions/", StringComparison.OrdinalIgnoreCase)
                || change.AzureResourceId.Contains("/virtualNetworkLinks/", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public void Compare_suppresses_nested_resource_removed_changes_when_parent_was_removed()
    {
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        const string parentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string childArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/ext";
        const string siblingArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm2";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(
            snapshotAId,
            Guid.NewGuid(),
            parentArmId,
            region: "eastus",
            tagKey: "env",
            tagValue: "prod",
            extraResourceArmId: childArmId,
            secondExtraResourceArmId: siblingArmId);

        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId,
            Guid.NewGuid(),
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            region: "eastus",
            tagKey: "env",
            tagValue: "prod");

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, snapshotAId, snapshotBId);

        changes
            .Where(c => c.ChangeType == AzureInventoryChangeType.ResourceRemoved)
            .Select(c => c.AzureResourceId)
            .Should()
            .BeEquivalentTo([parentArmId, siblingArmId]);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        string region,
        string tagKey,
        string tagValue,
        string? sku = null,
        string? extraResourceArmId = null,
        string? secondExtraResourceArmId = null)
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

        if (!string.IsNullOrWhiteSpace(secondExtraResourceArmId))
        {
            resources.Add(new AzureInventoryResourceRecord
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                AzureResourceId = secondExtraResourceArmId,
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
