using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class RequestAssumptionMaterializerTests
{
    [Fact]
    public void MaterializeFromAssumptionsMetadata_emits_assumption_nodes()
    {
        IReadOnlyList<GraphNode> nodes = RequestAssumptionMaterializer.MaterializeFromAssumptionsMetadata(
            "Single-region MVP|Entra ID for staff",
            Guid.NewGuid());

        nodes.Should().HaveCount(2);
        nodes.Should().OnlyContain(n => n.NodeType == GraphNodeTypes.Assumption);
    }
}
