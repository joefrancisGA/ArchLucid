using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalConsensusMergerTests
{
    [Fact]
    public void Merge_intersects_services_when_models_use_rename_alias_labels_for_same_service_id()
    {
        AgentTopologyProposal primary = new()
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
            ]
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedServices.Should().ContainSingle()
            .Which.ServiceId.Should().Be("svc-api");
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_datastores_when_models_use_rename_alias_labels_for_same_datastore_id()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                }
            ]
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "renamed-sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                }
            ]
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedDatastores.Should().ContainSingle()
            .Which.DatastoreId.Should().Be("ds-sql");
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_services_when_service_id_has_surrounding_whitespace()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "  svc-api  ",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedServices.Should().ContainSingle();
    }

    [Fact]
    public void Merge_prunes_relationships_when_intersected_services_no_longer_declares_both_endpoints()
    {
        AgentTopologyProposal primary = new()
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
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
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
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedServices.Should().ContainSingle()
            .Which.ServiceId.Should().Be("svc-api");
        result.MergedProposal.AddedRelationships.Should().BeEmpty(
            "service intersection dropped svc-worker so api→worker must not survive consensus merge");
    }

    [Fact]
    public void Merge_keeps_relationships_when_synthetic_endpoints_have_internal_whitespace()
    {
        static AgentTopologyProposal Proposal() =>
            new()
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-  api",
                        TargetId = "ds-  sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ],
            };

        TopologyProposalConsensusMergeResult result =
            TopologyProposalConsensusMerger.Merge(Proposal(), Proposal());

        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_keeps_relationship_when_endpoint_ids_have_surrounding_whitespace()
    {
        AgentTopologyProposal primary = new()
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
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "  svc-api  ",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primary.AddedServices,
            AddedRelationships = primary.AddedRelationships,
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_endpoint_whitespace_differs_between_models()
    {
        static AgentTopologyProposal Proposal(string sourceId) =>
            new()
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = sourceId,
                        TargetId = "ds-sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ],
            };

        TopologyProposalConsensusMergeResult result =
            TopologyProposalConsensusMerger.Merge(Proposal(" svc-api "), Proposal("svc-api"));

        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_pad_endpoint_ids_differently()
    {
        static List<ManifestService> Services() =>
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
                ServiceName = "worker",
                ServiceId = "svc-worker",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.AppService,
            },
        ];

        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "  svc-api  ",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };
        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_use_label_versus_synthetic_id_endpoints()
    {
        static List<ManifestService> Services() =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = "svc-api",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService,
            },
        ];

        static List<ManifestDatastore> Datastores() =>
        [
            new ManifestDatastore
            {
                DatastoreName = "sql",
                DatastoreId = "ds-sql",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
            },
        ];

        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_relationships_dedupes_duplicate_rows_from_primary()
    {
        ManifestRelationship relationship = new()
        {
            SourceId = "svc-api",
            TargetId = "ds-sql",
            RelationshipType = RelationshipType.ReadsFrom,
        };

        AgentTopologyProposal primary = new()
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
            ],
            AddedRelationships = [relationship, relationship],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primary.AddedServices,
            AddedDatastores = primary.AddedDatastores,
            AddedRelationships = [relationship],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_required_controls_when_whitespace_differs_between_models()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["SOC2"],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = [" SOC2 "],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.RequiredControls.Should().ContainSingle().Which.Should().Be("SOC2");
    }
}
