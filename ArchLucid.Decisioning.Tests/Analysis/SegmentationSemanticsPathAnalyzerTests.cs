using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class SegmentationSemanticsPathAnalyzerTests
{
    [Fact]
    public void IsSensitiveTarget_does_not_treat_nosql_label_as_datastore()
    {
        GraphNode node = CreateTopologyNode("Amazon DocumentDB NoSQL", sourceId: "docdb/catalog");

        SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSensitiveTarget_does_not_treat_non_postgres_label_as_datastore()
    {
        GraphNode node = CreateTopologyNode("non-postgres-cache-api", sourceId: "/providers/Microsoft.Web/sites/non-postgres-cache");

        SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSensitiveTarget_does_not_treat_non_database_label_as_datastore()
    {
        GraphNode node = CreateTopologyNode("non-database-cache-api", sourceId: "/providers/Microsoft.Web/sites/non-database-cache");

        SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSensitiveTarget_does_not_treat_non_storage_label_as_datastore()
    {
        GraphNode node = CreateTopologyNode("non-storage-telemetry-api", sourceId: "/providers/Microsoft.Web/sites/non-storage-telemetry");

        SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSensitiveTarget_still_treats_sql_server_as_datastore()
    {
        GraphNode node = CreateTopologyNode("sql-pay-prod", sourceId: "/providers/Microsoft.Sql/servers/sql-pay-prod");

        SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(node)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void HasPathToSensitiveTarget_includes_datastore_at_max_hop_count()
    {
        GraphNode nsg = CreateSegmentationNode("nsg-1");
        GraphNode n1 = CreateTopologyNode("hop-1", "n1");
        GraphNode n2 = CreateTopologyNode("hop-2", "n2");
        GraphNode sql = CreateTopologyNode("sql-pay-prod", "/providers/Microsoft.Sql/servers/sql-pay-prod");

        GraphSnapshot graph = new()
        {
            Nodes = [nsg, n1, n2, sql],
            Edges =
            [
                CreateEdge(nsg.NodeId, n1.NodeId),
                CreateEdge(n1.NodeId, n2.NodeId),
                CreateEdge(n2.NodeId, sql.NodeId),
            ],
        };

        bool found = SegmentationSemanticsPathAnalyzer.HasPathToSensitiveTarget(
            graph,
            nsg.NodeId,
            out GraphNode? target,
            out int hopCount);

        found.Should().BeTrue();
        target.Should().Be(sql);
        hopCount.Should().Be(SegmentationSemanticsPathAnalyzer.MaxHopCount);
    }

    private static GraphEdge CreateEdge(string fromNodeId, string toNodeId) =>
        new()
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0,
        };

    private static GraphNode CreateSegmentationNode(string nodeId) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_network_security_group",
            },
        };

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
