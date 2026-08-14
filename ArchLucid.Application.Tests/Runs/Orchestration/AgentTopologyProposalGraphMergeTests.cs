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

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_declares_rename_overlay_and_relationship()
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

        AgentResult compliance = new()
        {
            ResultId = "compliance-1",
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
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

        CrossAgentProposalConsistencyGate.ApplyToResults([compliance]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [compliance]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_overlay_service_id_has_surrounding_whitespace()
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

        AgentResult compliance = new()
        {
            ResultId = "compliance-1",
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

        CrossAgentProposalConsistencyGate.ApplyToResults([compliance]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [compliance]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_overlay_precedes_relationship_only_follow_up()
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

        AgentResult declaration = new()
        {
            ResultId = "compliance-1",
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
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

        AgentResult followUp = new()
        {
            ResultId = "compliance-2",
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
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

        AgentResult[] results = [followUp, declaration];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_declares_storage_category_datastore_rename_overlay()
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

        AgentResult compliance = new()
        {
            ResultId = "compliance-1",
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "renamed-artifacts",
                        DatastoreId = "ds-artifacts",
                        DatastoreType = DatastoreType.Object,
                        RuntimePlatform = RuntimePlatform.BlobStorage
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "renamed-artifacts",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([compliance]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [compliance]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "blob-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_follows_topology_service_claim_in_same_batch()
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
                        ServiceName = "api",
                        ServiceId = "svc-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ]
            }
        };

        AgentResult compliance = new()
        {
            ResultId = "compliance-1",
            AgentType = AgentType.Compliance,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Compliance,
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

        AgentResult[] results = [topology, compliance];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_new_service_and_edge_on_agent_proposed_only_graph()
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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-worker" &&
            e.ToNodeId == "svc-billing" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_new_service_and_edge_on_mixed_inventoried_and_agent_proposed_graph()
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
                    NodeId = "svc-worker",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "worker",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = nameof(AgentType.Topology),
                    SourceId = "ProposedChanges"
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
                        ServiceName = "billing-api",
                        ServiceId = "svc-billing",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "worker",
                        TargetId = "billing-api",
                        RelationshipType = RelationshipType.Calls
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Nodes.Should().HaveCount(3);
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-worker" &&
            e.ToNodeId == "svc-billing" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_arm_source_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_graph_resource_id_has_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_graph_terraform_source_id_has_surrounding_whitespace()
    {
        const string rawTerraformSourceId = "azurerm_app_service.main";
        const string paddedTerraformSourceId = $"  {rawTerraformSourceId}  ";

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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_node_has_missing_category_but_synthetic_datastore_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    Category = GraphTopologyCategories.Compute,
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_management_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "apim-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_static_site_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "web-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_signalr_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "signalr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_logic_app_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "logic-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_key_vault_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "kv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "secrets",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_key_vault.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "kv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_plan_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "plan-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_spring_cloud_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "spring-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_search_service_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "search-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "catalog",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_search_service.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "search-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_servicebus_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_eventhub_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "eh-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "events",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_eventhub_namespace.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "eh-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_container_registry_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "acr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cognitive_account_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "cog-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "openai",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_cognitive_account.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "cog-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_fabric_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_synapse_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "syn-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "synapse",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_synapse_workspace.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "syn-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_application_gateway_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "agw-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_factory_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "adf-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "etl",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_data_factory.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "adf-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_linux_virtual_machine_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vm-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mariadb_server_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "mdb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "mariadb",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mariadb_server.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mdb-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_batch_account_node_has_storage_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "batch-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_machine_learning_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "ml-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "ml",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_machine_learning_workspace.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ml-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_traffic_manager_profile_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "tm-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_databricks_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "dbx-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "lakehouse",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_databricks_workspace.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "dbx-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_load_balancer_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_kusto_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "kusto-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "logs",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_kusto_cluster.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "kusto-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cdn_frontdoor_profile_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fd-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_app_configuration_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "appcfg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "config",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_app_configuration.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "appcfg-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_firewall_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fw-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_netapp_volume_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "netapp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "files",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_netapp_volume.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "netapp-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_container_group_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "cg-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_recovery_services_vault_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "rsv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "backup",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_recovery_services_vault.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "rsv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_express_route_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "er-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_private_endpoint_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "pe-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "storage-pe",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_private_endpoint.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pe-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_automation_account_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "aa-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_log_analytics_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "law-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "logs",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_log_analytics_workspace.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "law-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_virtual_network_gateway_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vng-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_application_insights_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "ai-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "telemetry",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_application_insights.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ai-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dns_zone_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dns-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_managed_disk_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "disk-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "data-disk",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_managed_disk.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "disk-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_bastion_host_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "bastion-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_stream_analytics_job_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "asa-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "events",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_stream_analytics_job.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "asa-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_nat_gateway_node_has_data_category_but_synthetic_service_id_used()
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "nat-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_iothub_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "iot-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "devices",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_iothub.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "iot-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_entra_id_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "idp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "idp",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azuread_application.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-idp",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "idp-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_powerbi_embedded_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "pbi-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "bi",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_powerbi_embedded.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-bi",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pbi-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_connection_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "conn-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sharepoint",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_api_connection.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-sharepoint",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "conn-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_eventgrid_topic_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "eg-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "orders",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_eventgrid_topic.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-orders",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "eg-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_monitor_action_group_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "mag-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "alerts",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_monitor_action_group.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-alerts",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "mag-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_redis_enterprise_cache_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "redis-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "cache",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_redis_enterprise_cache.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-cache",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "redis-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_communication_service_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "acs-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sms",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_communication_service.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-sms",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "acs-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_maps_account_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "maps-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "geo",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_maps_account.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-geo",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "maps-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_web_pubsub_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "wps-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "realtime",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_web_pubsub.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "wps-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_share_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "share-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "partner",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_data_share.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-partner",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "share-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_healthbot_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "hb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "carebot",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_healthbot_healthbot.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-carebot",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "hb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_digital_twins_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "dt-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "factory",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_digital_twins_instance.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-factory",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "dt-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_notification_hub_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "nh-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "push",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_notification_hub_namespace.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-push",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "nh-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_media_services_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "ams-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "stream",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_media_services_account.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-stream",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ams-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_fluid_relay_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "fr-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "collab",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_fluid_relay_server.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-collab",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_elastic_san_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "esan-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vol",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_elastic_san.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-vol",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "esan-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_orbital_spacecraft_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "orb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sat",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_orbital_spacecraft.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-sat",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "orb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_healthcare_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "hc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "fhir",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_healthcare_workspace.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-fhir",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "hc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_virtual_hub_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "vh-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "wan",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_virtual_hub.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vh-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_managed_lustre_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "ml-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "hpc",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_managed_lustre_file_system.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-hpc",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ml-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_lab_service_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "lab-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "devbox",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_lab_service.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-devbox",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lab-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_video_indexer_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "vi-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "media",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_video_indexer.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-media",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "vi-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_load_test_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "lt-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "perf",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_load_test.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-perf",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lt-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_hpc_cache_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "hpc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "scratch",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_hpc_cache.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-scratch",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "hpc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dynatrace_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "dt-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "apm",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_dynatrace_monitor.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-apm",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dt-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_backup_vault_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "bv-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "archive",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_backup_vault.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-archive",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "bv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_kubernetes_fleet_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "kf-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "fleet",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_kubernetes_fleet_manager.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-fleet",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "kf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mobile_network_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "mn-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "ran",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mobile_network.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-ran",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mn-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_relay_namespace_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "relay-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "bridge",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_relay_namespace.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-bridge",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "relay-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dev_center_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "adc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "portal",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_dev_center.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-portal",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "adc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_center_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "apc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "catalog",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_api_center.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-catalog",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "apc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_graph_account_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "ga-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "identity",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_graph_account.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-identity",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ga-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dashboard_grafana_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "graf-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "metrics",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_dashboard_grafana.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-metrics",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "graf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_fabric_capacity_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "fab-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "analytics",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_fabric_capacity.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-analytics",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "fab-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_chaos_studio_target_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "chaos-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "resilience",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_chaos_studio_target.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-resilience",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "chaos-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_confidential_ledger_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "cl-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "ledger",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_confidential_ledger.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-ledger",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "cl-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_stack_hci_cluster_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "hci-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "edge",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_stack_hci_cluster.main"
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

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "hci-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_pinecone_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "pc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vectors",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_pinecone.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-vectors",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_voice_services_gateway_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "vs-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "telephony",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_voice_services_communications_gateway.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-telephony",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vs-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mongo_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "mc-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "documents",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_mongo_cluster.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-documents",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_workloads_sap_discovery_site_node_has_data_category_but_synthetic_service_id_used()
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
                    NodeId = "sap-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "discovery",
                    Category = GraphTopologyCategories.Data,
                    SourceType = "Terraform",
                    SourceId = "azurerm_workloads_sap_discovery_site.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-discovery",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sap-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_elastic_cloud_elasticsearch_node_has_compute_category_but_synthetic_datastore_id_used()
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
                    NodeId = "es-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "search",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Terraform",
                    SourceId = "azurerm_elastic_cloud_elasticsearch.main"
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
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "ds-search",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "es-1");
    }
}
