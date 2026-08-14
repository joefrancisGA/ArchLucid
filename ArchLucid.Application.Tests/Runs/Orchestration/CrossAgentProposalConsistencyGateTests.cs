using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class CrossAgentProposalConsistencyGateTests
{
    [Fact]
    public void ApplyToResults_preserves_renamed_datastore_relationships_to_undeclared_graph_endpoints()
    {
        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
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
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology]);

        topology.ProposedChanges!.AddedRelationships.Should().ContainSingle();
        topology.ProposedChanges.AddedRelationships![0].TargetId.Should().Be("renamed-sql");
    }

    [Fact]
    public void ApplyToResults_preserves_relationship_only_proposals_referencing_prior_agent_endpoints()
    {
        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
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
            },
        };

        AgentResult cost = new()
        {
            AgentType = AgentType.Cost,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology, cost]);

        cost.ProposedChanges!.AddedRelationships.Should().ContainSingle();
        cost.ProposedChanges.AddedRelationships![0].TargetId.Should().Be("sql");
    }

    [Fact]
    public void ApplyToResults_strips_duplicate_service_names_from_later_agents()
    {
        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        AgentResult cost = new()
        {
            AgentType = AgentType.Cost,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.Functions,
                    },
                    new ManifestService
                    {
                        ServiceName = "worker",
                        ServiceType = ServiceType.Worker,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([cost, topology]);

        cost.ProposedChanges!.AddedServices.Should().ContainSingle();
        cost.ProposedChanges.AddedServices[0].ServiceName.Should().Be("worker");
    }

    [Fact]
    public void ApplyToResults_claims_required_controls_once_across_agents()
    {
        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                RequiredControls = ["Key Vault", "Private Endpoints"],
            },
        };

        AgentResult critic = new()
        {
            AgentType = AgentType.Critic,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Critic,
                RequiredControls = ["Key Vault", "Diagnostic Logging"],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([critic, compliance]);

        critic.ProposedChanges!.RequiredControls.Should().BeEquivalentTo(["Diagnostic Logging"]);
    }

    [Fact]
    public void ApplyToResults_keeps_relationships_keyed_by_service_and_datastore_ids()
    {
        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
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
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology]);

        topology.ProposedChanges!.AddedRelationships.Should().ContainSingle();
        topology.ProposedChanges.AddedRelationships[0].SourceId.Should().Be("svc-1");
    }

    [Fact]
    public void ApplyToResults_strips_duplicate_service_ids_from_later_agents()
    {
        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
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
            },
        };

        AgentResult cost = new()
        {
            AgentType = AgentType.Cost,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.Functions,
                    },
                    new ManifestService
                    {
                        ServiceName = "worker",
                        ServiceId = "svc-2",
                        ServiceType = ServiceType.Worker,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([cost, topology]);

        cost.ProposedChanges!.AddedServices.Should().ContainSingle();
        cost.ProposedChanges.AddedServices[0].ServiceName.Should().Be("worker");
    }
}
