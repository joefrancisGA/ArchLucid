using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGateTests
{
    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

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
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void WithMergedTopologyProposals_WhenInventoryExists_AllowsMatchingInventoriedLabelsOnly()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

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
                        ServiceName = "existing-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].Label.Should().Be("existing-api");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedCostProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
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
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsUninventoriedComplianceProposalLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "invented-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRequiredControlsOnlyComplianceProposal()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                RequiredControls = ["encrypt-at-rest"]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.RequiredControls.Should().ContainSingle("encrypt-at-rest");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsRelationshipsWithOnlyOneInventoriedEndpoint()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "inv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "existing-api",
                        TargetId = "invented-db"
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-1",
                        TargetId = "ds-1",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsServicesKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ]
        };

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle()
            .Which.ServiceId.Should().Be("svc-1");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsDatastoresKeyedByInventoriedNodeIds()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

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
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle()
            .Which.DatastoreId.Should().Be("ds-1");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByRenamedServiceLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].SourceId.Should().Be("renamed-api");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByArmResourceIdProperty()
    {
        const string vmResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string> { ["resourceId"] = vmResourceId }
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = vmResourceId,
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedBySyntheticServiceNodeId()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedBySyntheticDatastoreNodeIdForStorageCategory()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "blob-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "artifacts",
                    Category = GraphTopologyCategories.Storage,
                    SourceType = "Terraform",
                    SourceId = "azurerm_storage_account.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-artifacts",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipsKeyedByRenamedDatastoreLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

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
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].TargetId.Should().Be("renamed-sql");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipOnlyProposalsReferencingAgentProposedGraphEndpoints()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships![0].SourceId.Should().Be("worker");
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRelationshipOnlyProposalsBetweenAgentProposedGraphEndpoints()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-cache",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "cache",
                    Category = GraphTopologyCategories.Data,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "cache",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedServiceOverlayForAgentProposedGraphNode()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedDatastoreOverlayForAgentProposedGraphNode()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-sql",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ]
        };

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
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasFromPriorResult()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-api",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-sql",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
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
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = new()
        {
            ResultId = "cost-1",
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology, cost]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_RejectsRelationshipToUnknownEndpoint()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-cache",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "cache",
                    Category = GraphTopologyCategories.Data,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "phantom",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_AllowsRelationshipBetweenAgentProposedEndpoints()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                },
                new GraphNode
                {
                    NodeId = "ds-cache",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "cache",
                    Category = GraphTopologyCategories.Data,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "cache",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenOnlyAgentProposedTopologyExists_AllowsNewServiceDeclarationsInSameBatch()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ]
        };

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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenMixedGraphExists_AllowsTopologyToDeclareNewServicesAlongsideAgentProposedNodes()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ]
        };

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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls,
                    },
                ],
            },
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_RejectsRelationshipOnlyProposalsWithoutDeclaredEndpoints()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "phantom",
                        TargetId = "other",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsGreenfieldServiceAndDatastoreProposals()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

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
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedDatastores.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_StripsRelationshipsReferencingUndeclaredEndpoints()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

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
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "phantom",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().BeEmpty();
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasFromPriorResult()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

        AgentResult topology = new()
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
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = new()
        {
            ResultId = "cost-1",
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology, cost]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsCostRelationshipOnlyProposalsReferencingTopologyRenameAliasWhenCostResultAppearsFirst()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

        AgentResult topology = new()
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
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult cost = new()
        {
            ResultId = "cost-1",
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost, topology]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r => r.ResultId == "cost-1" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenGraphIsEmpty_AllowsTopologyRelationshipOnlyFollowUpReferencingPriorTopologyRenameAliasWhenFollowUpAppearsFirst()
    {
        GraphSnapshot graph = new()
        {
            Nodes = []
        };

        AgentResult firstTopology = new()
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
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };

        AgentResult followUpTopology = new()
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
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [followUpTopology, firstTopology]);

        filtered.Should().HaveCount(2);
        filtered.Should().ContainSingle(r =>
            r.ResultId == "topology-2" && r.ProposedChanges!.AddedRelationships!.Count == 1);
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_RejectsRelationshipOnlyFollowUpWithUndeclaredRenameLabels()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

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
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        AgentResult[] results = [followUp, declaration];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, results);

        filtered.Should().ContainSingle(r => r.ResultId == "topology-1");
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_arm_source_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string> { ["resourceId"] = rawArmId }
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = paddedArmId,
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_graph_resource_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string> { ["resourceId"] = paddedArmId }
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = rawArmId,
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_graph_terraform_source_id_has_surrounding_whitespace()
    {
        const string rawTerraformSourceId = "azurerm_app_service.main";
        const string paddedTerraformSourceId = $"  {rawTerraformSourceId}  ";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = paddedTerraformSourceId
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = rawTerraformSourceId,
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_datastore_node_has_missing_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_datastore_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_WhenInventoryExists_AllowsRenamedServiceOverlayWhenServiceIdHasSurroundingWhitespace()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult compliance = new()
        {
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "  svc-api  ",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_api_management_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "apim-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "apim",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_api_management.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-apim",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_static_site_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "web-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "frontend",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_static_site.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-frontend",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_signalr_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "signalr-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "realtime",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_signalr_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-realtime",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_logic_app_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "logic-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "workflow",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_logic_app_workflow.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-workflow",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_key_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "kv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "secrets",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_key_vault.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-secrets",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_plan_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "plan-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "hosting",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_service_plan.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-hosting",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_spring_cloud_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "spring-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "backend",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_spring_cloud_service.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-backend",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_search_service_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "search-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "catalog",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_search_service.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-catalog",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_servicebus_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "orders",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_servicebus_namespace.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-orders",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_eventhub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "eh-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "events",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_eventhub_namespace.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-events",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_container_registry_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "acr-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "acr",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_container_registry.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-acr",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cognitive_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "cog-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "openai",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_cognitive_account.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-openai",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_service_fabric_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sf-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "fabric",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_service_fabric_cluster.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-fabric",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_synapse_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "syn-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "synapse",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_synapse_workspace.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-synapse",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_application_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "agw-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "gateway",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_application_gateway.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-gateway",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_data_factory_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "adf-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "etl",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_data_factory.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-etl",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_linux_virtual_machine_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "vm-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_linux_virtual_machine.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-worker",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_mariadb_server_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "mdb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "mariadb",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mariadb_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-mariadb",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_batch_account_node_has_storage_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "batch-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "batch",
                    Category = GraphTopologyCategories.Storage,
                    SourceType = "Terraform",
                    SourceId = "azurerm_batch_account.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-batch",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_machine_learning_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ml-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "ml",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_machine_learning_workspace.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-ml",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_traffic_manager_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "tm-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "traffic",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_traffic_manager_profile.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-traffic",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_databricks_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "dbx-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "lakehouse",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_databricks_workspace.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-lakehouse",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_load_balancer_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "lb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "public",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_lb.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-public",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_kusto_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "kusto-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "logs",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_kusto_cluster.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-logs",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_cdn_frontdoor_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "fd-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "edge",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_cdn_frontdoor_profile.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-edge",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_app_configuration_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "appcfg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "config",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_configuration.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-config",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_firewall_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "fw-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "perimeter",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_firewall.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-perimeter",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_netapp_volume_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "netapp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "files",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_netapp_volume.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-files",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_container_group_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_container_group.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-worker",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_recovery_services_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "rsv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "backup",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_recovery_services_vault.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-backup",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_express_route_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "er-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "wan",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_express_route_circuit.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-wan",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_private_endpoint_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "pe-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "storage-pe",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_private_endpoint.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-storage-pe",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_automation_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "aa-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "runbooks",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_automation_account.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-runbooks",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_log_analytics_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "law-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "logs",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_log_analytics_workspace.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-logs",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_virtual_network_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "vng-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vpn",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_virtual_network_gateway.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-vpn",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_application_insights_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "ai-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "telemetry",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_application_insights.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-telemetry",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_dns_zone_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "dns-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "corp",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_dns_zone.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-corp",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_managed_disk_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "disk-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "data-disk",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_managed_disk.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-data-disk",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_bastion_host_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "bastion-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "jump",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_bastion_host.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-jump",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_stream_analytics_job_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "asa-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "events",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_stream_analytics_job.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-events",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_nat_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "nat-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "egress",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_nat_gateway.main"
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-egress",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_iothub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                },
                new GraphNode
                {
                    NodeId = "iot-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "devices",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_iothub.main"
                }
            ]
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-devices",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }
}
