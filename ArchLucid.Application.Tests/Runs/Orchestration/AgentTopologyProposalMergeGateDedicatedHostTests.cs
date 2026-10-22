using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateDedicatedHostTests
{
    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dedicated_host_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_linux_virtual_machine.main"),
            ComputeNode(nodeId: "dh-1", label: "isolated", sourceId: "azurerm_dedicated_host.isolated"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-isolated")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
