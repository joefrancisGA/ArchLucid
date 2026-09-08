using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class SegmentationSemanticsFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_for_internet_to_22_with_datastore_path()
    {
        GraphSnapshot graph = BuildInternetTo22WithSqlPathFixture();

        SegmentationSemanticsFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("segmentation-semantics");
        finding.Title.Should().Contain("port 22");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:nsg-web");

        SegmentationSemanticsFindingPayload payload =
            finding.Payload.Should().BeOfType<SegmentationSemanticsFindingPayload>().Subject;

        payload.DestinationPort.Should().Be(22);
        payload.TargetNodeId.Should().Be("sql-pay");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_for_private_cidr_only_rule()
    {
        GraphSnapshot graph = BuildInternetTo22WithSqlPathFixture(
            ruleBlob: "access = allow direction = inbound source_address_prefix = 10.0.0.0/8 destination_port_range = 22");

        SegmentationSemanticsFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_for_presence_only_nsg_without_rules_blob()
    {
        GraphSnapshot graph = BuildInternetTo22WithSqlPathFixture(includeRuleBlob: false);

        SegmentationSemanticsFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_uses_doc_evidence_when_source_id_is_declaration_path()
    {
        GraphSnapshot graph = BuildInternetTo22WithSqlPathFixture(sourceId: "modules/network/main.tf");

        SegmentationSemanticsFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Trace!.Notes.Should().Contain("evidence:doc:modules/network/main.tf");
    }

    private static GraphSnapshot BuildInternetTo22WithSqlPathFixture(
        bool includeRuleBlob = true,
        string? ruleBlob = null,
        string? sourceId = null)
    {
        GraphNode nsg = new()
        {
            NodeId = "nsg-web",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "web-nsg",
            SourceId = sourceId ?? "azurerm_network_security_group.web",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_network_security_group",
            },
        };

        if (includeRuleBlob)
        {
            nsg.Properties["tf.security_rule"] = ruleBlob
                ?? "access = allow direction = inbound source_address_prefix = * destination_port_range = 22";
        }

        GraphNode subnet = new()
        {
            NodeId = "subnet-app",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "app-subnet",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Network,
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
            Nodes = [nsg, subnet, sql],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = nsg.NodeId,
                    ToNodeId = subnet.NodeId,
                    EdgeType = GraphEdgeTypes.AppliesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = subnet.NodeId,
                    ToNodeId = sql.NodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
                },
            ],
        };
    }
}
