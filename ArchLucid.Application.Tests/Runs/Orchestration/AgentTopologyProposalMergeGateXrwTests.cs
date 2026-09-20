using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.KnowledgeGraph.Models;
using FluentAssertions;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;
namespace ArchLucid.Application.Tests.Runs.Orchestration;
[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateXrwTests
{
    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_xrw_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_linux_virtual_machine.main"),
            ComputeNode(nodeId: "xr-1", label: "xrw", sourceId: "azurerm_xrw.main"));
        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-xrw")));
        IReadOnlyList<AgentResult> filtered = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);
        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
