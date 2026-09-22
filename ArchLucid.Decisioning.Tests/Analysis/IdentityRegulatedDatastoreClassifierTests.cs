using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

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

    [Fact]
    public void IsRegulatedDatastore_does_not_treat_non_pci_label_as_pci_sensitive()
    {
        GraphNode node = CreateTopologyNode("non-pci-orders-sql", sourceId: "/providers/Microsoft.Sql/servers/non-pci-orders-sql");
        GraphSnapshot graphSnapshot = new();

        IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsRegulatedDatastore_does_not_treat_insensitive_label_as_sensitive()
    {
        GraphNode node = CreateTopologyNode("insensitive-telemetry-sql", sourceId: "/providers/Microsoft.Sql/servers/insensitive-telemetry-sql");
        GraphSnapshot graphSnapshot = new();

        IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, node)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsRegulatedDatastore_still_treats_pci_label_as_regulated()
    {
        GraphNode node = CreateTopologyNode("pci-orders-sql", sourceId: "/providers/Microsoft.Sql/servers/pci-orders-sql");
        GraphSnapshot graphSnapshot = new();

        IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, node)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsRegulatedDatastore_does_not_treat_non_private_baseline_protection_as_regulated()
    {
        GraphNode datastore = CreateTopologyNode(
            "telemetry-sql",
            sourceId: "/providers/Microsoft.Sql/servers/telemetry-sql",
            nodeId: "ds-telemetry");

        GraphNode baseline = new()
        {
            NodeId = "baseline-non-private",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "non-private-network-baseline",
            SourceId = "baseline/non-private",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };

        GraphSnapshot graphSnapshot = new()
        {
            Nodes = [baseline, datastore],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = baseline.NodeId,
                    ToNodeId = datastore.NodeId,
                    EdgeType = GraphEdgeTypes.Protects,
                    Weight = GraphEdgeDecisioningThresholds.MinWeightForSemanticLink,
                },
            ],
        };

        IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, datastore)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsRegulatedDatastore_still_treats_private_only_baseline_protection_as_regulated()
    {
        GraphNode datastore = CreateTopologyNode(
            "telemetry-sql",
            sourceId: "/providers/Microsoft.Sql/servers/telemetry-sql",
            nodeId: "ds-telemetry");

        GraphNode baseline = new()
        {
            NodeId = "baseline-private",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "private-network-only-baseline",
            SourceId = "baseline/private",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };

        GraphSnapshot graphSnapshot = new()
        {
            Nodes = [baseline, datastore],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = baseline.NodeId,
                    ToNodeId = datastore.NodeId,
                    EdgeType = GraphEdgeTypes.Protects,
                    Weight = GraphEdgeDecisioningThresholds.MinWeightForSemanticLink,
                },
            ],
        };

        IdentityRegulatedDatastoreClassifier.IsRegulatedDatastore(graphSnapshot, datastore)
            .Should()
            .BeTrue();
    }

    private static GraphNode CreateTopologyNode(string label, string sourceId, string nodeId = "node-1")
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceId = sourceId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
