using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class IdentityRegulatedDatastoreClassifierTests
{
    [Fact]
    public void IsDatastoreNode_does_not_false_positive_on_nosql_label()
    {
        GraphNode node = CreateTopologyNode("Amazon DocumentDB NoSQL", sourceId: "docdb/catalog");

        IdentityRegulatedDatastoreClassifier.IsDatastoreNode(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsDatastoreNode_still_matches_sql_server_label()
    {
        GraphNode node = CreateTopologyNode("sql-pay-prod", sourceId: "/providers/Microsoft.Sql/servers/sql-pay-prod");

        IdentityRegulatedDatastoreClassifier.IsDatastoreNode(node)
            .Should()
            .BeTrue();
    }

    private static GraphNode CreateTopologyNode(string label, string sourceId)
    {
        return new GraphNode
        {
            NodeId = "node-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceId = sourceId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
