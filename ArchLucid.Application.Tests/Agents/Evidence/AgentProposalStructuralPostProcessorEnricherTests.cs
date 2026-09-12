using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Category", "Unit")]
public sealed class AgentProposalStructuralPostProcessorEnricherTests
{
    [Fact]
    public async Task EnrichAsync_records_structural_grounding_drop_log_on_evidence_package()
    {
        ArchitectureRequest request = new()
        {
            Description = "HTTPS-only brief",
            SystemName = "brief-grounding-enricher",
            Constraints = ["HTTPS only for all public endpoints"],
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = "run-1",
            RequestId = "req-1",
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

        AgentProposalStructuralPostProcessorEnricher enricher = new();

        await enricher.EnrichAsync("run-1", request, evidence, [result]);

        result.ProposedChanges!.AddedServices.Should().BeEmpty();
        evidence.StructuralGroundingDropLog.Should().ContainSingle()
            .Which.Should().Contain("contradicts confirmed HTTPS constraint");
    }
}
