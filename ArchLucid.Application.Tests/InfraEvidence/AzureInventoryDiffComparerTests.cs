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

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Compare_detects_addition_or_removal_of_null_valued_tag(bool added)
    {
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();
        const string armId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(
            snapshotAId, resourceRowId, armId, "eastus", added ? null : "env", null);
        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId, resourceRowId, armId, "eastus", added ? "env" : null, null);

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, snapshotAId, snapshotBId);

        AzureInventoryChangeRecord change = changes.Should().ContainSingle().Subject;
        change.ChangeType.Should().Be(AzureInventoryChangeType.TagChanged);
        change.Property.Should().Be("tag:env");
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

    [Theory]
    [InlineData("ABCDEF01-2345-6789-ABCD-EF0123456789", 0)]
    [InlineData("BBCDEF01-2345-6789-ABCD-EF0123456789", 2)]
    public void Compare_uses_case_insensitive_role_assignment_ids(string principalId, int expectedChanges)
    {
        const string scope = "/subscriptions/sub/resourceGroups/rg";
        const string role = "/providers/Microsoft.Authorization/roleDefinitions/ABCDEF01-2345-6789-ABCD-EF0123456790";
        AzureInventorySnapshotDetailReadModel snapshotA = new()
        {
            RoleAssignments =
            [
                new() { Scope = scope, PrincipalId = "abcdef01-2345-6789-abcd-ef0123456789", RoleDefinitionId = role },
            ],
        };
        AzureInventorySnapshotDetailReadModel snapshotB = new()
        {
            RoleAssignments =
            [
                new() { Scope = scope.ToUpperInvariant(), PrincipalId = principalId, RoleDefinitionId = role.ToLowerInvariant() },
            ],
        };

        List<AzureInventoryChangeRecord> changes =
            AzureInventoryDiffComparer.Compare(snapshotA, snapshotB, Guid.NewGuid(), Guid.NewGuid());

        changes.Select(change => change.ChangeType).Should()
            .Equal(Enumerable.Repeat(AzureInventoryChangeType.PermissionChanged, expectedChanges));
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        string region,
        string? tagKey,
        string? tagValue,
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
            Tags = tagKey is null
                ? []
                :
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
