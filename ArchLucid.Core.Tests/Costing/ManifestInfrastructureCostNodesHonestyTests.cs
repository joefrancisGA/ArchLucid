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
