using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
public sealed class AgentTopologyProposalGraphMergeReferencePropertyTests
{
    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Production_merge_matches_naive_reference_oracle(GraphSnapshot graph, AgentResult[] results)
    {
        GraphSnapshot production = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);
        GraphSnapshot reference = AgentTopologyProposalGraphMergeReference.WithMergedTopologyProposals(graph, results);

        AgentTopologyProposalGraphMergePropertyTests.AssertStructurallyEqual(reference, production);
    }
}
