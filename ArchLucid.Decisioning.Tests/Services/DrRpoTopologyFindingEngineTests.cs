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
        finding.EvidenceRefs.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_populates_EvidenceRefs_from_datastore_arm_property()
    {
        const string armResourceId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-pay/providers/Microsoft.Sql/servers/sql-pay-prod/databases/payments";

        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: true, sqlResourceId: armResourceId);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EvidenceRefs.Should().ContainSingle().Which.Should().Be(armResourceId);
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

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_quality_attribute_has_typed_rto_hours()
    {
        GraphSnapshot graph = BuildQualityAttributeFixture(includeFailoverGroup: false);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dr-rpo-topology");
        finding.Title.Should().Contain("RTO 240 min");
        finding.Title.Should().Contain("sql-pay-prod");

        DrRpoTopologyFindingPayload payload =
            finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>().Subject;

        payload.RtoMinutes.Should().Be(240);
        payload.RequirementNodeId.Should().Be("qa-availability-1");
    }

    [Fact]
    public async Task RequestQualityAttributeMaterializer_output_drives_dr_rpo_topology_engine()
    {
        Guid snapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute(
                "RTO 4 hours for payment API",
                snapshotId);

        GraphNode qualityAttribute = materialized.Should().ContainSingle().Subject;

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                qualityAttribute,
                new GraphNode
                {
                    NodeId = "sql-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Data,
                        ["terraformType"] = "azurerm_mssql_database",
                    },
                },
            ],
        };

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>()
            .Subject.RtoMinutes.Should().Be(240);
    }

    private static GraphSnapshot BuildQualityAttributeFixture(bool includeFailoverGroup)
    {
        Dictionary<string, string> sqlProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["category"] = GraphTopologyCategories.Data,
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeFailoverGroup)
            sqlProperties["failover_group"] = "fg-pay-prod";

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "qa-availability-1",
                    NodeType = GraphNodeTypes.QualityAttribute,
                    Label = "Availability quality attribute",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["theme"] = "availability",
                        ["rtoHours"] = "4",
                        ["sourceQualityAttribute"] = "RTO 4 hours for payment API",
                    },
                },
                new GraphNode
                {
                    NodeId = "sql-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = sqlProperties,
                },
            ],
        };
    }

    private static GraphSnapshot BuildFixture(
        bool includeFailoverGroup,
        bool includeRpoText,
        string? sqlResourceId = null)
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

        if (!string.IsNullOrWhiteSpace(sqlResourceId))
        {
            sqlProperties["resourceId"] = sqlResourceId;
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
