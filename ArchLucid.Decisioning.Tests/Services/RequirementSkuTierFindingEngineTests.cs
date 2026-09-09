using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class RequirementSkuTierFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_zone_redundant_requirement_and_lrs_sku()
    {
        GraphSnapshot graph = BuildFixture(sku: "Standard_LRS", includeZoneRedundantText: true);

        RequirementSkuTierFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("requirement-sku-tier");
        finding.Category.Should().Be("Requirement");
        finding.Title.Should().Contain("zone-redundant");
        finding.Title.Should().Contain("sql-pay-prod");
        finding.Title.Should().Contain("Standard_LRS");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:req-redundancy-1");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:sql-pay-prod");

        RequirementSkuTierFindingPayload payload =
            finding.Payload.Should().BeOfType<RequirementSkuTierFindingPayload>().Subject;

        payload.ObservedSku.Should().Be("Standard_LRS");
        payload.DatastoreNodeId.Should().Be("sql-pay-prod");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_premium_zrs_sku()
    {
        GraphSnapshot graph = BuildFixture(sku: "Premium_ZRS", includeZoneRedundantText: true);

        RequirementSkuTierFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_sku_missing()
    {
        GraphSnapshot graph = BuildFixture(sku: null, includeZoneRedundantText: true);

        RequirementSkuTierFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot BuildFixture(string? sku, bool includeZoneRedundantText)
    {
        GraphNode requirement = new()
        {
            NodeId = "req-redundancy-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment SQL",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = includeZoneRedundantText
                    ? "Payment SQL must be zone-redundant."
                    : "Payment SQL must be resilient.",
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

        if (sku is not null)
        {
            sqlProperties["sku"] = sku;
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
