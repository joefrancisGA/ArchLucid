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

    [Fact]
    public void ApplyToResults_preserves_rename_alias_datastores_within_same_agent_proposal()
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
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-sql",
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

        topology.ProposedChanges!.AddedDatastores.Should().HaveCount(2);
        topology.ProposedChanges.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void ApplyToResults_preserves_rename_alias_services_within_same_agent_proposal()
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
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.Functions,
                    },
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
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
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology]);

        topology.ProposedChanges!.AddedServices.Should().HaveCount(2);
        topology.ProposedChanges.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void ApplyToResults_preserves_cost_relationship_only_proposals_referencing_topology_rename_alias_service()
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
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.Functions,
                    },
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
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
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology, cost]);

        cost.ProposedChanges!.AddedRelationships.Should().ContainSingle();
        cost.ProposedChanges.AddedRelationships![0].SourceId.Should().Be("renamed-api");
    }

    [Fact]
    public void ApplyToResults_preserves_cost_relationship_only_proposals_referencing_topology_rename_alias_datastore()
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
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-sql",
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
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology, cost]);

        cost.ProposedChanges!.AddedRelationships.Should().ContainSingle();
        cost.ProposedChanges.AddedRelationships![0].TargetId.Should().Be("renamed-sql");
    }

    [Fact]
    public void ApplyToResults_defers_topology_relationship_only_follow_up_with_undeclared_rename_labels_to_merge_gate()
    {
        AgentResult declaration = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    }
                ],
            }
        };

        AgentResult followUp = new()
        {
            ResultId = "topology-2",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ],
            }
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([followUp, declaration]);

        followUp.ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void ApplyToResults_preserves_relationship_only_inventoried_endpoints_when_batch_declares_unrelated_service()
    {
        AgentResult unrelatedDeclaration = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "worker",
                        ServiceId = "svc-worker",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    }
                ]
            }
        };

        AgentResult inventoriedRelationship = new()
        {
            ResultId = "topology-2",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ],
            }
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([inventoriedRelationship, unrelatedDeclaration]);

        inventoriedRelationship.ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void ApplyToResults_preserves_topology_relationship_only_follow_up_when_rename_aliases_are_declared_later_in_batch()
    {
        AgentResult declaration = new()
        {
            ResultId = "topology-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    }
                ],
            }
        };

        AgentResult followUp = new()
        {
            ResultId = "topology-2",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ],
            }
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([followUp, declaration]);

        followUp.ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
