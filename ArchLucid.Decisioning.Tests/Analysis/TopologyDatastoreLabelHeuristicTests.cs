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
    public void IsRegulatedDatastoreTopologyNode_does_not_false_positive_on_non_secret_label()
    {
        GraphNode node = CreateTopologyNode("non-secret-api-gateway", sourceId: "/providers/Microsoft.Web/sites/non-secret-api");

        TopologyDatastoreLabelHeuristic.IsRegulatedDatastoreTopologyNode(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsRegulatedDatastoreTopologyNode_does_not_false_positive_on_non_storage_label()
    {
        GraphNode node = CreateTopologyNode("non-storage-telemetry-api", sourceId: "/providers/Microsoft.Web/sites/non-storage-telemetry");

        TopologyDatastoreLabelHeuristic.IsRegulatedDatastoreTopologyNode(node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsRegulatedDatastoreTopologyNode_still_matches_storage_account_label()
    {
        GraphNode node = CreateTopologyNode("payments-storage-account", sourceId: "/providers/Microsoft.Storage/storageAccounts/payments");

        TopologyDatastoreLabelHeuristic.IsRegulatedDatastoreTopologyNode(node)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsRegulatedDatastoreTopologyNode_still_matches_keyvault_label()
    {
        GraphNode node = CreateTopologyNode("payments-keyvault", sourceId: "/providers/Microsoft.KeyVault/vaults/payments-kv");

        TopologyDatastoreLabelHeuristic.IsRegulatedDatastoreTopologyNode(node)
            .Should()
            .BeTrue();
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
