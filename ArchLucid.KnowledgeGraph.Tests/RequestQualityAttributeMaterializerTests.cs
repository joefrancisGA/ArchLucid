using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class RequestQualityAttributeMaterializerTests
{
    [Fact]
    public void MaterializeFromQualityAttribute_parses_rto_into_availability_theme_node()
    {
        IReadOnlyList<GraphNode> nodes = RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute(
            "RTO 4 hours for payment API",
            Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].Properties["theme"].Should().Be("availability");
        nodes[0].Properties["rtoHours"].Should().Be("4");
    }
}
