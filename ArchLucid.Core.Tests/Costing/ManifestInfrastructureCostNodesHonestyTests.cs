using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestInfrastructureCostNodesHonestyTests
{
    [Fact]
    public void FromGoldenTopology_preserves_stored_counts_and_normalizes_pricing_hints()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromGoldenTopology(
            [new ManifestService { ServiceName = "api", InstanceCount = 3, AzureArmRegion = " eastus ", AzurePricingSku = " Standard_D2s_v3 " }],
            [new ManifestDatastore { DatastoreName = "orders", InstanceCount = 2, AzureArmRegion = " ", AzurePricingSku = " " }]);

        nodes.Select(static node => node.Quantity).Should().Equal(3, 2);
        nodes[0].ArmRegion.Should().Be("eastus");
        nodes[0].SkuOrTier.Should().Be("Standard_D2s_v3");
        nodes[1].ArmRegion.Should().BeNull();
        nodes[1].SkuOrTier.Should().BeNull();
    }

    [Fact]
    public void FromGoldenTopology_uses_not_stored_labels_and_zero_quantity_for_missing_names()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromGoldenTopology(
            [
                new ManifestService
                {
                    ServiceName = " ",
                    RuntimePlatform = RuntimePlatform.AppService,
                    InstanceCount = 0,
                },
            ],
            [
                new ManifestDatastore
                {
                    DatastoreName = "",
                    RuntimePlatform = RuntimePlatform.SqlServer,
                    InstanceCount = -1,
                },
            ]);

        nodes.Should().HaveCount(2);
        nodes[0].DisplayName.Should().Be(ManifestInfrastructureCostNodes.ServiceNameNotStoredLabel);
        nodes[0].Quantity.Should().Be(0);
        nodes[1].DisplayName.Should().Be(ManifestInfrastructureCostNodes.DatastoreNameNotStoredLabel);
        nodes[1].Quantity.Should().Be(0);
    }
}
