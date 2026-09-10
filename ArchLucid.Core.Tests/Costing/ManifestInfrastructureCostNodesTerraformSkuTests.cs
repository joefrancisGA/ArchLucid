using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class ManifestInfrastructureCostNodesTerraformSkuTests
{
    [Fact]
    public void FromTerraformResourceRows_maps_available_row_fields_only()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromTerraformResourceRows([
            new TerraformInfrastructureCostResourceRow("web", "aws_instance", "us-east-1"),
        ]);

        InfrastructureCostQueryNode node = nodes.Should().ContainSingle().Subject;
        node.DisplayName.Should().Be("web");
        node.Platform.Should().Be(RuntimePlatform.Ec2);
        node.ArmRegion.Should().Be("us-east-1");
        node.SkuOrTier.Should().BeNull("TerraformInfrastructureCostResourceRow carries no instance-type/sku field yet");
    }
}
