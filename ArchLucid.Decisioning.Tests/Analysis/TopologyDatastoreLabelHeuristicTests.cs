using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class TopologyDatastoreLabelHeuristicTests
{
    [Fact]
    public void IsSkuRpoDatastoreTopologyNode_does_not_treat_aks_cluster_as_datastore()
    {
        GraphNode node = CreateTopologyNode("AKS cluster prod", sourceId: "/providers/Microsoft.ContainerService/managedClusters/aks-prod");

        TopologyDatastoreLabelHeuristic.IsSkuRpoDatastoreTopologyNode(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsSkuRpoDatastoreTopologyNode_still_matches_sql_failover_cluster()
    {
        GraphNode node = CreateTopologyNode("sql failover cluster", sourceId: "sql/cluster/prod");

        TopologyDatastoreLabelHeuristic.IsSkuRpoDatastoreTopologyNode(node)
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
