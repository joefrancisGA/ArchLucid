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
    public void ApplyToProposal_preserves_relationship_only_proposals_for_commit_merge_gate_validation()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
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
        proposal.AddedRelationships![0].SourceId.Should().Be("svc-1");
    }

    [Fact]
    public void ApplyToProposal_preserves_renamed_service_relationships_to_undeclared_graph_endpoints()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-1",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "renamed-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedRelationships.Should().ContainSingle();
        proposal.AddedRelationships![0].TargetId.Should().Be("sql");
    }

    [Fact]
    public void ApplyToProposal_preserves_renamed_datastore_relationships_to_undeclared_graph_endpoints()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "renamed-sql",
                    DatastoreId = "ds-1",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "renamed-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedRelationships.Should().ContainSingle();
        proposal.AddedRelationships![0].SourceId.Should().Be("api");
    }

    [Fact]
    public void ApplyToProposal_defers_relationships_with_undeclared_endpoints_to_commit_merge_gate_validation()
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

        proposal.AddedRelationships.Should().HaveCount(2);
        proposal.AddedRelationships.Should().Contain(r => r.TargetId == "db");
        proposal.AddedRelationships.Should().Contain(r => r.TargetId == "missing");
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
    public void ApplyToProposal_preserves_rename_alias_services_with_shared_ids_within_single_proposal()
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

        proposal.AddedServices.Should().HaveCount(2);
        proposal.AddedServices.Should().Contain(s => s.ServiceName == "api");
        proposal.AddedServices.Should().Contain(s => s.ServiceName == "renamed-api");
    }

    [Fact]
    public void ApplyToProposal_preserves_rename_alias_datastores_with_shared_ids_within_single_proposal()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreId = "ds-1",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
                new ManifestDatastore
                {
                    DatastoreName = "renamed-sql",
                    DatastoreId = "ds-1",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedDatastores.Should().HaveCount(2);
        proposal.AddedDatastores.Should().Contain(d => d.DatastoreName == "sql");
        proposal.AddedDatastores.Should().Contain(d => d.DatastoreName == "renamed-sql");
    }

    [Fact]
    public void ApplyToProposal_dedupes_exact_duplicate_service_ids_within_single_proposal()
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
                    ServiceName = "api",
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
