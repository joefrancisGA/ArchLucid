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
    public void Merge_intersects_relationships_when_models_use_module_qualified_versus_root_terraform_addresses()
    {
        const string rootTerraformAddress = "azurerm_app_service.main";

        static List<ManifestService> Services() =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = rootTerraformAddress,
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
                    SourceId = rootTerraformAddress,
                    TargetId = "ds-sql",
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
                    SourceId = $"module.wrapper.{rootTerraformAddress}",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_disagree_only_on_quoted_for_each_instance_key()
    {
        const string indexedRoot = "azurerm_app_service.main";

        static List<ManifestService> Services(string serviceId) =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = serviceId,
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
            AddedServices = Services($"{indexedRoot}[\"0\"]"),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = $"{indexedRoot}[\"0\"]",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services($"{indexedRoot}[0]"),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = $"{indexedRoot}[0]",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_does_not_intersect_relationships_when_models_reference_different_for_each_terraform_keys()
    {
        const string indexedRoot = "azurerm_key_vault.kv";

        static List<ManifestService> Services() =>
        [
            new ManifestService
            {
                ServiceName = "vault-a",
                ServiceId = $"{indexedRoot}[\"env-a\"]",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService,
            },
            new ManifestService
            {
                ServiceName = "vault-b",
                ServiceId = $"{indexedRoot}[\"env-b\"]",
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
                    SourceId = $"{indexedRoot}[\"env-a\"]",
                    TargetId = "ds-sql",
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
                    SourceId = $"{indexedRoot}[\"env-b\"]",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().BeEmpty();
        result.DisagreementCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Merge_does_not_intersect_relationships_when_models_reference_different_indexed_terraform_instances()
    {
        const string indexedRoot = "azurerm_app_service.main";

        static List<ManifestService> Services() =>
        [
            new ManifestService
            {
                ServiceName = "api-0",
                ServiceId = $"{indexedRoot}[0]",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService,
            },
            new ManifestService
            {
                ServiceName = "api-1",
                ServiceId = $"{indexedRoot}[1]",
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
                    SourceId = $"{indexedRoot}[0]",
                    TargetId = "ds-sql",
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
                    SourceId = $"{indexedRoot}[1]",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().BeEmpty();
        result.DisagreementCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Merge_does_not_intersect_relationships_when_one_model_uses_unindexed_root_and_other_uses_indexed_instance()
    {
        const string indexedRoot = "azurerm_app_service.main";

        static List<ManifestService> Services() =>
        [
            new ManifestService
            {
                ServiceName = "api-0",
                ServiceId = $"{indexedRoot}[0]",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.AppService,
            },
            new ManifestService
            {
                ServiceName = "api-1",
                ServiceId = $"{indexedRoot}[1]",
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
                    SourceId = indexedRoot,
                    TargetId = "ds-sql",
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
                    SourceId = $"{indexedRoot}[0]",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().BeEmpty();
        result.DisagreementCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_use_arm_endpoint_casing_variation()
    {
        const string armApiNormalized =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api";
        const string armApiUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api";

        static List<ManifestService> Services(string serviceId) =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = serviceId,
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
            AddedServices = Services(armApiNormalized),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armApiUpper,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(armApiNormalized),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armApiNormalized,
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
    public void Merge_intersects_relationships_when_models_use_arm_endpoint_without_leading_slash()
    {
        const string armCanonical =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api";
        const string armNoLeadingSlash =
            "subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api";

        static List<ManifestService> Services(string serviceId) =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = serviceId,
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
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armNoLeadingSlash,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armCanonical,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_use_arm_endpoint_trailing_slash_variation()
    {
        const string armCanonical =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api";
        const string armTrailingSlash = armCanonical + "/";

        static List<ManifestService> Services(string serviceId) =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = serviceId,
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
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armTrailingSlash,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armCanonical,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void Merge_intersects_relationships_when_models_use_arm_endpoint_duplicate_slash_variation()
    {
        const string armCanonical =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api";
        const string armDuplicateSlash =
            "/subscriptions/sub//resourcegroups/rg/providers/microsoft.web/sites/api";

        static List<ManifestService> Services(string serviceId) =>
        [
            new ManifestService
            {
                ServiceName = "api",
                ServiceId = serviceId,
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
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armDuplicateSlash,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = Services(armCanonical),
            AddedDatastores = Datastores(),
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = armCanonical,
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedRelationships.Should().ContainSingle();
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

    [Fact]
    public void Merge_reports_zero_disagreement_when_required_controls_differ_only_by_whitespace_and_duplicate_casing_on_one_model()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["pci  ", "PCI"],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["pci"],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.RequiredControls.Should().ContainSingle().Which.Should().Be("pci");
    }

    [Fact]
    public void Merge_counts_service_disagreement_when_models_use_name_only_versus_synthetic_service_id()
    {
        AgentTopologyProposal primary = new()
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
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedServices.Should().BeEmpty();
        result.DisagreementCount.Should().Be(2);
        result.MergedProposal.Warnings.Should().ContainSingle(w => w.Contains("human review", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Merge_disagreement_count_includes_secondary_only_duplicate_relationship_rows()
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
            AddedRelationships = [relationship],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primary.AddedServices,
            AddedDatastores = primary.AddedDatastores,
            AddedRelationships = [relationship, relationship],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().ContainSingle();
        result.DisagreementCount.Should().Be(1);
    }

    [Fact]
    public void Merge_keeps_intersected_relationship_when_endpoint_uses_secondary_rename_label_and_intersected_service_retains_primary_name()
    {
        ManifestRelationship relationship = new()
        {
            SourceId = "renamed-api",
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
            AddedRelationships = [relationship],
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
                },
            ],
            AddedDatastores = primary.AddedDatastores,
            AddedRelationships = [relationship],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().ContainSingle()
            .Which.SourceId.Should().Be("renamed-api");
    }

    [Fact]
    public void Merge_keeps_intersected_relationship_when_endpoint_uses_secondary_datastore_rename_label_and_intersected_datastore_retains_primary_name()
    {
        ManifestRelationship relationship = new()
        {
            SourceId = "svc-api",
            TargetId = "renamed-sql",
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
            AddedRelationships = [relationship],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primary.AddedServices,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "renamed-sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
            AddedRelationships = [relationship],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().ContainSingle()
            .Which.TargetId.Should().Be("renamed-sql");
    }

    [Fact]
    public void Merge_does_not_intersect_datastores_when_same_id_and_type_but_runtime_platform_differs()
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
                },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.Redis,
                },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedDatastores.Should().BeEmpty();
        result.DisagreementCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Merge_reports_zero_disagreement_when_models_agree_on_relationship_pruned_for_undeclared_endpoints()
    {
        ManifestRelationship relationship = new()
        {
            SourceId = "svc-api",
            TargetId = "phantom-worker",
            RelationshipType = RelationshipType.Calls,
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
            AddedRelationships = [relationship],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primary.AddedServices,
            AddedRelationships = [relationship],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedRelationships.Should().BeEmpty();
        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_relationships_when_one_model_uses_renamed_api_label_and_other_uses_synthetic_svc_id()
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
                ServiceName = "renamed-api",
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
                    SourceId = "renamed-api",
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
    }
}
