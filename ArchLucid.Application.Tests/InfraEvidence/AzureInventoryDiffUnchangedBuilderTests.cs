using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDiffUnchangedBuilderTests
{
    [Fact]
    public void BuildUnchangedResourceChanges_returns_resources_present_in_both_snapshots_without_recorded_changes()
    {
        Guid diffId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid snapshotAId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid snapshotBId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string unchangedArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string changedArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(snapshotAId, unchangedArmId, changedArmId);
        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(snapshotBId, unchangedArmId, changedArmId);
        HashSet<string> changedAzureResourceIds = new(StringComparer.OrdinalIgnoreCase) { changedArmId };

        List<AzureInventoryChangeRecord> unchanged = AzureInventoryDiffUnchangedBuilder.BuildUnchangedResourceChanges(
            snapshotA,
            snapshotB,
            diffId,
            snapshotAId,
            snapshotBId,
            changedAzureResourceIds);

        unchanged.Should().ContainSingle();
        unchanged[0].ChangeType.Should().Be(AzureInventoryChangeType.ResourceUnchanged);
        unchanged[0].AzureResourceId.Should().Be(unchangedArmId);
        unchanged[0].RiskClassification.Should().Be("none");
        List<AzureInventoryChangeRecord> repeat = AzureInventoryDiffUnchangedBuilder.BuildUnchangedResourceChanges(
            snapshotA,
            snapshotB,
            diffId,
            snapshotAId,
            snapshotBId,
            changedAzureResourceIds);

        unchanged[0].ChangeId.Should().NotBe(Guid.Empty);
        unchanged[0].ChangeId.Should().Be(repeat[0].ChangeId);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        string unchangedArmId,
        string changedArmId)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    TenantId = Guid.NewGuid(),
                    AzureResourceId = unchangedArmId,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    Region = "eastus",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = snapshotId,
                    TenantId = Guid.NewGuid(),
                    AzureResourceId = changedArmId,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                    Region = "eastus",
                },
            ],
        };
    }
}
