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
