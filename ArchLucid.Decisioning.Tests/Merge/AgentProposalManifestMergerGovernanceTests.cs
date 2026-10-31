using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class AgentProposalManifestMergerGovernanceTests
{
    [Fact]
    public void MergeAgentResultsIntoManifest_preserves_blank_service_id_without_inventing_guid()
    {
        GoldenManifest manifest = new()
        {
            RunId = "run-1",
            SystemName = "Sys",
            Services = [],
        };

        AgentResult result = new()
        {
            ResultId = "res-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Confidence = 0.9,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedServices =
                [
                    new ManifestService { ServiceId = "   ", ServiceName = "checkout-api" },
                ],
            },
        };

        DecisionMergeResult output = new();
        AgentProposalManifestMerger sut = new();

        sut.MergeAgentResultsIntoManifest("run-1", [result], manifest, output);

        manifest.Services.Should().ContainSingle();
        manifest.Services[0].ServiceId.Should().BeEmpty();
    }
}
