using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentProposalStructuralPostProcessorTests
{
    [Fact]
    public void ApplyToProposal_dedupes_services_and_sets_source_agent()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.Functions },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Cost, proposal);

        proposal.SourceAgent.Should().Be(AgentType.Cost);
        proposal.AddedServices.Should().ContainSingle();
        proposal.AddedServices[0].RuntimePlatform.Should().Be(RuntimePlatform.AppService);
    }

    [Fact]
    public void ApplyToProposal_strips_relationships_without_known_endpoints()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
            ],
            AddedDatastores =
            [
                new ManifestDatastore { DatastoreName = "db", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer },
            ],
            AddedRelationships =
            [
                new ManifestRelationship { SourceId = "api", TargetId = "db", RelationshipType = RelationshipType.ReadsFrom },
                new ManifestRelationship { SourceId = "api", TargetId = "missing", RelationshipType = RelationshipType.Calls },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedRelationships.Should().ContainSingle();
        proposal.AddedRelationships[0].TargetId.Should().Be("db");
    }

    [Fact]
    public void ApplyToProposal_keeps_relationships_keyed_by_service_and_datastore_ids()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "svc-1",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreId = "ds-1",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-1",
                    TargetId = "ds-1",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedRelationships.Should().ContainSingle();
        proposal.AddedRelationships[0].TargetId.Should().Be("ds-1");
    }

    [Fact]
    public void ApplyToProposal_dedupes_required_controls_for_compliance()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["Key Vault", "Key Vault", "  Private Endpoints  ", ""],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Compliance, proposal);

        proposal.RequiredControls.Should().BeEquivalentTo(["Key Vault", "Private Endpoints"]);
    }

    [Fact]
    public void ApplyToProposal_dedupes_duplicate_service_ids_within_single_proposal()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "svc-1",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-1",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.Functions,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedServices.Should().ContainSingle();
        proposal.AddedServices[0].ServiceName.Should().Be("api");
    }

    [Fact]
    public void ApplyToProposal_keeps_id_only_services_when_name_is_absent()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceId = "svc-1",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedServices.Should().ContainSingle();
        proposal.AddedServices[0].ServiceId.Should().Be("svc-1");
    }
}
