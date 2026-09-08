using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class DataFlowTrustBoundaryFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_for_ingress_to_sql_without_trust_boundary_hop()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture();

        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("data-flow-trust-boundary");
        finding.Title.Should().Contain("ingress-lb");
        finding.Title.Should().Contain("sql-pay-prod");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:actor-ingress");

        DataFlowTrustBoundaryFindingPayload payload =
            finding.Payload.Should().BeOfType<DataFlowTrustBoundaryFindingPayload>().Subject;

        payload.ActorNodeId.Should().Be("actor-ingress");
        payload.DatastoreNodeId.Should().Be("sql-pay");
        payload.HopCount.Should().Be(2);
        payload.CrossedTrustBoundary.Should().BeFalse();
        payload.PathNodeIds.Should().Contain(["actor-ingress", "app-api", "sql-pay"]);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_trust_boundary_on_path()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture(includeTrustBoundaryOnPath: true);

        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_datastore_has_private_endpoint()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture(privateEndpointEnabled: true);

        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_no_edges()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture(includeEdges: false);

        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_for_internal_only_actors()
    {
        GraphSnapshot graph = BuildIngressToSqlFixture(trustOrigin: nameof(TrustOrigin.Internal));

        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot BuildIngressToSqlFixture(
        bool includeEdges = true,
        bool includeTrustBoundaryOnPath = false,
        bool privateEndpointEnabled = false,
        string trustOrigin = nameof(TrustOrigin.External))
    {
        GraphNode actor = new()
        {
            NodeId = "actor-ingress",
            NodeType = GraphNodeTypes.Actor,
            Label = "ingress-lb",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["trustOrigin"] = trustOrigin,
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

        Dictionary<string, string> sqlProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["category"] = GraphTopologyCategories.Data,
        };

        if (privateEndpointEnabled)
        {
            sqlProperties["privateEndpointEnabled"] = "true";
        }

        GraphNode sql = new()
        {
            NodeId = "sql-pay",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-pay-prod",
            Properties = sqlProperties,
        };

        List<GraphNode> nodes = [actor, app, sql];
        List<GraphEdge> edges = [];

        if (includeTrustBoundaryOnPath)
        {
            GraphNode trustBoundary = new()
            {
                NodeId = "tb-app-sql",
                NodeType = GraphNodeTypes.TrustBoundary,
                Label = "app-sql-boundary",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["actorNodeId"] = actor.NodeId,
                },
            };

            nodes.Add(trustBoundary);

            if (includeEdges)
            {
                edges.AddRange(
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
                        ToNodeId = trustBoundary.NodeId,
                        EdgeType = GraphEdgeTypes.ConnectsTo,
                        Weight = 1.0,
                    },
                    new GraphEdge
                    {
                        FromNodeId = trustBoundary.NodeId,
                        ToNodeId = sql.NodeId,
                        EdgeType = GraphEdgeTypes.ConnectsTo,
                        Weight = 1.0,
                    },
                ]);
            }
        }
        else if (includeEdges)
        {
            edges.AddRange(
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
            ]);
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }
}
