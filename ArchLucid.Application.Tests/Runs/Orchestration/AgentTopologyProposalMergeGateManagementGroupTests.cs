using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateManagementGroupTests
{
    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_management_group_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_linux_virtual_machine.main"),
            ComputeNode(nodeId: "mg-1", label: "corp", sourceId: "azurerm_management_group.corp"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-corp")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
