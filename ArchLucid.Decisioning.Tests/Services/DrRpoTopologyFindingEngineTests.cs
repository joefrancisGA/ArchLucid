using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class DrRpoTopologyFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_rpo_declared_and_sql_lacks_replica_keys()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: true);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dr-rpo-topology");
        finding.Category.Should().Be("Requirement");
        finding.Title.Should().Contain("RPO 15 min");
        finding.Title.Should().Contain("sql-pay-prod");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:req-dr-1");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:sql-pay-prod");

        DrRpoTopologyFindingPayload payload =
            finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>().Subject;

        payload.RpoMinutes.Should().Be(15);
        payload.DatastoreNodeId.Should().Be("sql-pay-prod");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_failover_group_present()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: true, includeRpoText: true);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_no_rpo_text()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: false);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot BuildFixture(bool includeFailoverGroup, bool includeRpoText)
    {
        GraphNode requirement = new()
        {
            NodeId = "req-dr-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment DR",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = includeRpoText
                    ? "Payment SQL must meet RPO 15 min."
                    : "Application must be resilient.",
            },
        };

        GraphNode service = new()
        {
            NodeId = "svc-checkout",
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
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeFailoverGroup)
        {
            sqlProperties["failover_group"] = "fg-pay-prod";
        }

        GraphNode sql = new()
        {
            NodeId = "sql-pay-prod",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-pay-prod",
            Properties = sqlProperties,
        };

        return new GraphSnapshot
        {
            Nodes = [requirement, service, sql],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = requirement.NodeId,
                    ToNodeId = service.NodeId,
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = service.NodeId,
                    ToNodeId = sql.NodeId,
                    EdgeType = GraphEdgeTypes.DependsOn,
                    Weight = 1.0,
                },
            ],
        };
    }
}
