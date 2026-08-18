using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentProposalBriefGroundingTests
{
    [Fact]
    public void ApplyBriefGrounding_drops_service_contradicting_https_constraint()
    {
        ArchitectureRequest request = new()
        {
            Description = "Test system with HTTPS requirement",
            SystemName = "brief-grounding",
            Constraints = ["HTTPS only for all public endpoints"],
        };

        AgentResult result = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "public-http-gateway",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        List<string> dropLog = [];
        AgentProposalStructuralPostProcessor.ApplyBriefGrounding(request, [result], dropLog);

        result.ProposedChanges!.AddedServices.Should().BeEmpty();
        dropLog.Should().ContainSingle();
    }
}
