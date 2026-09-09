using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class OpenCommitmentTopologyJoinerTests
{
    [Fact]
    public void TryJoin_matches_resource_token_from_deferred_finding_title()
    {
        GraphSnapshot graph = BuildGraph(
            nodeId: "topo-stpayprod",
            label: "stpayprod",
            sourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod");

        FindingInspectResponse inspect = BuildInspect(
            title: "Deferred public network access on stpayprod",
            rationale: "Operator accepted temporary public access.");

        OpenCommitmentTopologyJoiner.JoinResult result =
            OpenCommitmentTopologyJoiner.TryJoin(graph, inspect, trailEvent: null);

        result.TopologyMatch.Should().BeTrue();
        result.MatchedNode!.NodeId.Should().Be("topo-stpayprod");
    }

    [Fact]
    public void TryJoin_unmatched_commitment_does_not_invent_node()
    {
        GraphSnapshot graph = BuildGraph(
            nodeId: "topo-other",
            label: "other-storage",
            sourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/other-storage");

        FindingInspectResponse inspect = BuildInspect(
            title: "Deferred encryption review",
            rationale: "No resource named in this commitment.");

        OpenCommitmentTopologyJoiner.JoinResult result =
            OpenCommitmentTopologyJoiner.TryJoin(graph, inspect, trailEvent: null);

        result.TopologyMatch.Should().BeFalse();
        result.MatchedNode.Should().BeNull();
    }

    [Fact]
    public void TryJoin_matches_related_node_id_hint_from_inspect_evidence()
    {
        GraphSnapshot graph = BuildGraph(
            nodeId: "topo-kv-pay",
            label: "kv-pay-prod",
            sourceId: "azurerm_key_vault.kv_pay_prod");

        FindingInspectResponse inspect = new()
        {
            FindingId = "f-kv",
            Evidence =
            [
                new FindingInspectEvidenceItem { Excerpt = "topo-kv-pay" },
            ],
        };

        OpenCommitmentTopologyJoiner.JoinResult result =
            OpenCommitmentTopologyJoiner.TryJoin(graph, inspect, trailEvent: null);

        result.TopologyMatch.Should().BeTrue();
        result.MatchedNode!.NodeId.Should().Be("topo-kv-pay");
    }

    [Fact]
    public void TryJoin_null_graph_nodes_does_not_throw()
    {
        GraphSnapshot graph = new() { Nodes = null! };

        OpenCommitmentTopologyJoiner.JoinResult result =
            OpenCommitmentTopologyJoiner.TryJoin(graph, inspect: null, trailEvent: null);

        result.TopologyMatch.Should().BeFalse();
    }

    private static GraphSnapshot BuildGraph(string nodeId, string label, string sourceId)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = nodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = label,
                    SourceId = sourceId,
                    Properties = new Dictionary<string, string>(),
                },
            ],
        };
    }

    private static FindingInspectResponse BuildInspect(string title, string rationale)
    {
        return new FindingInspectResponse
        {
            FindingId = "f-defer",
            TypedPayload = System.Text.Json.JsonSerializer.SerializeToElement(new
            {
                title,
                rationale,
            }),
        };
    }
}
