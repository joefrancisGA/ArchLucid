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

    [Fact]
    public async Task EnrichAsync_appends_structural_grounding_drop_log_when_enricher_runs_again_on_same_evidence()
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
            StructuralGroundingDropLog = ["prior-batch drop"],
        };

        AgentResult retryResult = new()
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

        await enricher.EnrichAsync("run-1", request, evidence, [retryResult]);

        evidence.StructuralGroundingDropLog.Should().HaveCount(2);
        evidence.StructuralGroundingDropLog[0].Should().Be("prior-batch drop");
        evidence.StructuralGroundingDropLog[1].Should().Contain("contradicts confirmed HTTPS constraint");
    }

    [Fact]
    public async Task EnrichAsync_drops_relationship_when_only_one_endpoint_was_removed_by_brief_grounding()
    {
        // A call from a dropped service to an external id is not "both endpoints declared".
        // Brief grounding still has to remove that edge or the dropped service stays on the diagram.
        ArchitectureRequest request = new()
        {
            Description = "HTTPS-only brief",
            SystemName = "brief-grounding-external-edge",
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
                    new ManifestService
                    {
                        ServiceName = "secure-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "public-http-gateway",
                        TargetId = "partner-system",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        AgentProposalStructuralPostProcessorEnricher enricher = new();

        await enricher.EnrichAsync("run-1", request, evidence, [result]);

        result.ProposedChanges!.AddedServices.Should().ContainSingle()
            .Which.ServiceName.Should().Be("secure-api");
        result.ProposedChanges.AddedRelationships.Should().BeEmpty();
        evidence.StructuralGroundingDropLog.Should().Contain(line =>
            line.Contains("public-http-gateway", StringComparison.Ordinal)
            && line.Contains("partner-system", StringComparison.Ordinal));
    }

    [Fact]
    public async Task EnrichAsync_keeps_proposal_when_brief_lists_are_null()
    {
        ArchitectureRequest request = new()
        {
            Description = "Brief lists omitted",
            SystemName = "null-brief",
            Constraints = null!,
            RequiredCapabilities = null!,
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
                        ServiceName = "secure-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        AgentProposalStructuralPostProcessorEnricher enricher = new();

        await enricher.EnrichAsync("run-1", request, evidence, [result]);

        result.ProposedChanges!.AddedServices.Should().ContainSingle()
            .Which.ServiceName.Should().Be("secure-api");
    }
}
