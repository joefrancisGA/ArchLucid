using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
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
        dropLog.Should().ContainSingle()
            .Which.Should().Contain("contradicts confirmed HTTPS constraint");
    }

    [Fact]
    public void ApplyBriefGrounding_drops_public_datastore_when_private_networking_required()
    {
        ArchitectureRequest request = new()
        {
            Description = "Private networking brief",
            SystemName = "brief-grounding-private",
            Constraints = ["All data paths must use private endpoints"],
        };

        AgentResult result = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "public-sql-logs",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                ],
            },
        };

        List<string> dropLog = [];
        AgentProposalStructuralPostProcessor.ApplyBriefGrounding(request, [result], dropLog);

        result.ProposedChanges!.AddedDatastores.Should().BeEmpty();
        dropLog.Should().ContainSingle()
            .Which.Should().Contain("private-networking");
    }

    [Fact]
    public void ApplyBriefGrounding_drops_plaintext_datastore_when_encryption_at_rest_required()
    {
        ArchitectureRequest request = new()
        {
            Description = "Encryption brief",
            SystemName = "brief-grounding-encryption",
            RequiredCapabilities = ["encryption-at-rest"],
        };

        AgentResult result = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "plaintext-archive",
                        DatastoreType = DatastoreType.Object,
                        RuntimePlatform = RuntimePlatform.BlobStorage,
                    },
                ],
            },
        };

        List<string> dropLog = [];
        AgentProposalStructuralPostProcessor.ApplyBriefGrounding(request, [result], dropLog);

        result.ProposedChanges!.AddedDatastores.Should().BeEmpty();
        dropLog.Should().ContainSingle()
            .Which.Should().Contain("encryption-at-rest");
    }

    [Fact]
    public void ApplyBriefGrounding_prunes_relationships_to_dropped_services()
    {
        ArchitectureRequest request = new()
        {
            Description = "HTTPS-only brief",
            SystemName = "brief-grounding-relationships",
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
                        TargetId = "secure-api",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        List<string> dropLog = [];
        AgentProposalStructuralPostProcessor.ApplyBriefGrounding(request, [result], dropLog);

        result.ProposedChanges!.AddedServices.Should().ContainSingle()
            .Which.ServiceName.Should().Be("secure-api");
        result.ProposedChanges.AddedRelationships.Should().BeEmpty();
        dropLog.Should().HaveCount(2);
    }

    [Fact]
    public void ApplyBriefGrounding_ignores_unknown_sentinel_constraints()
    {
        ArchitectureRequest request = new()
        {
            Description = "Unknown placeholder brief",
            SystemName = "brief-grounding-unknown",
            Constraints = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview],
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

        result.ProposedChanges!.AddedServices.Should().ContainSingle();
        dropLog.Should().BeEmpty();
    }

    [Fact]
    public void ApplyBriefGrounding_filters_services_only_not_datastores_for_https()
    {
        ArchitectureRequest request = new()
        {
            Description = "HTTPS-only brief",
            SystemName = "brief-grounding-datastore",
            Constraints = ["HTTPS only for all public endpoints"],
        };

        AgentResult result = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "public-http-logs",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                ],
            },
        };

        List<string> dropLog = [];
        AgentProposalStructuralPostProcessor.ApplyBriefGrounding(request, [result], dropLog);

        result.ProposedChanges!.AddedDatastores.Should().ContainSingle();
        dropLog.Should().BeEmpty();
    }
}
