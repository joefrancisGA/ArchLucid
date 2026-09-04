using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AdvisoryTerraformRepresentationBuilderTests
{
    [Fact]
    public void Build_identical_snapshot_rows_produce_identical_content_hash()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        AdvisoryTerraformBuildResult first = AdvisoryTerraformRepresentationBuilder.Build(snapshot, aztfexportAvailable: false);
        AdvisoryTerraformBuildResult second = AdvisoryTerraformRepresentationBuilder.Build(snapshot, aztfexportAvailable: false);

        first.ContentHashSha256.Should().Equal(second.ContentHashSha256);
        first.Files.Should().ContainKey("ADVISORY.md");
        first.Mappings.Should().ContainSingle();
        first.Mappings[0].GenerationMethod.Should().Be(AdvisoryTerraformGenerationMethod.SnapshotReconstruction);
    }

    [Fact]
    public void Build_when_aztfexport_available_uses_hybrid_generation_method()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        AdvisoryTerraformBuildResult result =
            AdvisoryTerraformRepresentationBuilder.Build(snapshot, aztfexportAvailable: true);

        result.GenerationMethod.Should().Be(AdvisoryTerraformGenerationMethod.HybridAztfexportAndReconstruction);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot()
    {
        Guid snapshotId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

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
                    ResourceRowId = resourceRowId,
                    SnapshotId = snapshotId,
                    TenantId = Guid.NewGuid(),
                    AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    Region = "eastus",
                },
            ],
        };
    }
}
