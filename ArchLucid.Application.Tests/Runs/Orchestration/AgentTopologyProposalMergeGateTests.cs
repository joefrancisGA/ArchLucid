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
}
