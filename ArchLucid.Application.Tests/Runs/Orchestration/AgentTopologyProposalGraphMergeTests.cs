using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;
[Trait("Category", "Unit")]

public sealed class AgentTopologyProposalGraphMergeTests
{
    [SkippableFact]
    public void WithMergedTopologyProposals_adds_service_and_datastore_nodes_from_topology_result()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "p1",
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api", ServiceName = "rag-api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-metadata",
                        DatastoreName = "rag-metadata",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(n =>
            n.NodeType == GraphNodeTypes.TopologyResource && n.Label == "rag-api" && n.Category == GraphTopologyCategories.Compute);
        merged.Nodes.Should().Contain(n =>
            n.NodeType == GraphNodeTypes.TopologyResource && n.Label == "rag-metadata" && n.Category == GraphTopologyCategories.Data);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_labels_already_in_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode { NodeId = "x", NodeType = GraphNodeTypes.TopologyResource, Label = "rag-api" }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService { ServiceName = "rag-api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);
        merged.Nodes.Should().HaveCount(1);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_node_ids_already_in_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-existing",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "existing-api"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "new-label",
                        ServiceId = "svc-existing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);
        merged.Nodes.Should().HaveCount(1);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_propagates_topology_agent_reasoning_trace_to_added_nodes()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        const string reasoning = "Proposed storefront API based on ingestion hints.";

        AgentResult topology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-2",
            AgentType = AgentType.Topology,
            ReasoningTrace = reasoning,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "payments-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        GraphNode svc = merged.Nodes.Should().ContainSingle(n => n.Label == "payments-api").Subject;
        svc.ReasoningTrace.Should().Be(reasoning);
    }

    [SkippableFact]
    public void WouldChangeGraphForCommit_false_when_no_topology_proposals()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes = [],
            Edges = [],
        };

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, []).Should().BeFalse();
    }

    [SkippableFact]
    public void WouldChangeGraphForCommit_true_when_topology_adds_nodes()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes = [],
            Edges = [],
        };

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                AddedServices = [new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService }],
            },
        };

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, [topology]).Should().BeTrue();
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_edges_already_in_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
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
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "existing-edge",
                    FromNodeId = "svc-1",
                    ToNodeId = "ds-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = RelationshipType.ReadsFrom.ToString()
                }
            ],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().HaveCount(1);
        merged.Edges[0].EdgeId.Should().Be("existing-edge");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_nodes_when_service_id_matches_graph_source_id()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_service.main"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = "azurerm_app_service.main",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].NodeId.Should().Be("svc-1");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_graph_source_ids()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "azurerm_app_service.main",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_nodes_when_service_id_matches_arm_resource_id_property()
    {
        const string vmResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string> { ["resourceId"] = vmResourceId }
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-vm",
                        ServiceId = vmResourceId,
                        ServiceType = ServiceType.Worker,
                        RuntimePlatform = RuntimePlatform.Vm
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].NodeId.Should().Be("t1");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_arm_resource_id_properties()
    {
        const string vmResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string> { ["resourceId"] = vmResourceId }
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    SourceType = "Terraform",
                    SourceId = "azurerm_mssql_server.main"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_renamed_service_labels()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_renamed_service_overlay_uses_synthetic_service_id()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_renamed_datastore_overlay_uses_synthetic_datastore_id()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_renamed_labels_on_agent_proposed_nodes()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
                    NodeId = "ds-sql",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_block_new_services_when_non_topology_node_shares_label()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "api"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().ContainSingle(n =>
            n.NodeType == GraphNodeTypes.TopologyResource && n.Label == "api");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_renamed_services_from_prior_topology_results()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult firstTopology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentResult secondTopology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [firstTopology, secondTopology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_for_relationship_only_topology_proposals_when_graph_has_inventoried_endpoints()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_after_structural_post_processor_preserves_renamed_service_relationships()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

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
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = proposal,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_renamed_datastore_labels()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

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
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);
        CrossAgentProposalConsistencyGate.ApplyToResults(
        [
            new AgentResult
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            }
        ]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [
                new AgentResult
                {
                    ResultId = "r1",
                    TaskId = "t1",
                    RunId = "run-1",
                    AgentType = AgentType.Topology,
                    ProposedChanges = proposal,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_target_storage_category_by_synthetic_datastore_id()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "blob-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_block_new_datastores_when_non_topology_node_shares_label()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "req-1",
                    NodeType = GraphNodeTypes.Requirement,
                    Label = "sql"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().ContainSingle(n =>
            n.NodeType == GraphNodeTypes.TopologyResource && n.Label == "sql");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_renamed_datastores_from_prior_topology_results()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult firstTopology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentResult secondTopology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [firstTopology, secondTopology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_renamed_service_labels_from_prior_topology_results_for_relationship_only_follow_up()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult firstTopology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
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
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentResult secondTopology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [firstTopology, secondTopology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_renamed_datastore_labels_from_prior_topology_results_for_relationship_only_follow_up()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult firstTopology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    },
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-sql",
                        DatastoreId = "ds-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentResult secondTopology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [firstTopology, secondTopology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_renamed_service_labels_from_prior_topology_results_for_relationship_only_follow_up_when_follow_up_appears_first()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult firstTopology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
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
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentResult followUpTopology = new()
        {
            ResultId = "r2",
            TaskId = "t2",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [followUpTopology, firstTopology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_datastore_aliases_added_earlier_in_same_result()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    },
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "renamed-sql",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_resolves_service_aliases_added_earlier_in_same_result()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    },
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "renamed-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-sql",
                        DatastoreName = "sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_maps_AuthenticatesWith_to_DependsOn_edge()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
                    NodeId = "svc-idp",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "idp",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_active_directory.main"
                }
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "idp",
                        RelationshipType = RelationshipType.AuthenticatesWith
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "svc-idp" &&
            e.EdgeType == GraphEdgeTypes.DependsOn);
    }

    [SkippableFact]
    public void WouldChangeGraphForCommit_true_when_topology_adds_edges_only_on_inventoried_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, [topology]).Should().BeTrue();
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_for_relationship_only_proposals_referencing_agent_proposed_graph_endpoints()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-worker" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_renamed_service_overlay_targets_agent_proposed_node_on_mixed_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
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
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_after_structural_post_processor_preserves_renamed_datastore_aliases()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceId = "svc-api",
                    ServiceName = "api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService
                }
            ],
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "ds-sql",
                    DatastoreName = "sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer
                },
                new ManifestDatastore
                {
                    DatastoreId = "ds-sql",
                    DatastoreName = "renamed-sql",
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
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        AgentResult topology = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ProposedChanges = proposal,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_after_structural_post_processor_and_cross_agent_gate_preserve_renamed_datastore_aliases()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = []
        };

        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceId = "svc-api",
                    ServiceName = "api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService
                }
            ],
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "ds-sql",
                    DatastoreName = "sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer
                },
                new ManifestDatastore
                {
                    DatastoreId = "ds-sql",
                    DatastoreName = "renamed-sql",
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
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);
        CrossAgentProposalConsistencyGate.ApplyToResults(
        [
            new AgentResult
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                ProposedChanges = proposal,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            }
        ]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            graph,
            [
                new AgentResult
                {
                    ResultId = "r1",
                    TaskId = "t1",
                    RunId = "run-1",
                    AgentType = AgentType.Topology,
                    ProposedChanges = proposal,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_inventoried_edges_after_cross_agent_gate_when_batch_declares_unrelated_service()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
        };

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
                        RuntimePlatform = RuntimePlatform.AppService
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
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        AgentResult[] results = [inventoriedRelationship, unrelatedDeclaration];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WouldChangeGraphForCommit_true_when_cost_adds_relationship_on_inventoried_graph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
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

        AgentResult[] results = [topology, cost];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, results).Should().BeTrue();
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_from_cost_relationship_only_when_topology_declares_rename_overlay()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
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
            ],
            Edges = [],
            Warnings = []
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
                        ServiceName = "renamed-api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
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

        AgentResult[] results = [topology, cost];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }
}
