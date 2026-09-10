using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DataFlowTrustBoundaryPathAnalyzerTests
{
    [Fact]
    public void Analyze_returns_path_when_external_actor_reaches_datastore_without_boundary_hop()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture();

        IReadOnlyList<DataFlowTrustBoundaryPath> paths = DataFlowTrustBoundaryPathAnalyzer.Analyze(graph);

        DataFlowTrustBoundaryPath path = paths.Should().ContainSingle().Subject;
        path.ActorNodeId.Should().Be("actor-ingress");
        path.DatastoreNodeId.Should().Be("sql-pay");
        path.HopCount.Should().Be(2);
    }

    [Fact]
    public void HopCrossesTrustBoundary_is_true_for_trust_boundary_node()
    {
        GraphNode node = new()
        {
            NodeId = "tb-1",
            NodeType = GraphNodeTypes.TrustBoundary,
            Label = "boundary",
        };

        DataFlowTrustBoundaryPathAnalyzer.HopCrossesTrustBoundary(node).Should().BeTrue();
    }

    [Fact]
    public void HopCrossesTrustBoundary_is_true_for_private_endpoint_property()
    {
        GraphNode node = new()
        {
            NodeId = "sql-pay",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-pay-prod",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["privateEndpointEnabled"] = "true",
            },
        };

        DataFlowTrustBoundaryPathAnalyzer.HopCrossesTrustBoundary(node).Should().BeTrue();
    }

    private static GraphSnapshot BuildIngressToSqlFixture()
    {
        GraphNode actor = new()
        {
            NodeId = "actor-ingress",
            NodeType = GraphNodeTypes.Actor,
            Label = "ingress-lb",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["trustOrigin"] = nameof(TrustOrigin.External),
            },
        };

        GraphNode app = new()
        {
            NodeId = "app-api",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-api",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Compute,
            },
        };

        GraphNode sql = new()
        {
            NodeId = "sql-pay",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-pay-prod",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Data,
            },
        };

        return new GraphSnapshot
        {
            Nodes = [actor, app, sql],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = actor.NodeId,
                    ToNodeId = app.NodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = app.NodeId,
                    ToNodeId = sql.NodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
                },
            ],
        };
    }
}
