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
}
