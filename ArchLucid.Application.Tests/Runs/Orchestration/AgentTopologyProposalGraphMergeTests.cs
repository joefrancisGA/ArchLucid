using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;

namespace ArchLucid.Application.Tests.Runs.Orchestration;
/// <summary>
///     Named connector-family merge examples live here; algebraic invariants use
///     <see cref="AgentTopologyProposalGraphMergePropertyTests" /> and the Prompt 6 reference oracle.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalGraphMergeTests
{
    [SkippableFact]
    public void WithMergedTopologyProposals_adds_service_and_datastore_nodes_from_topology_result()
    {
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph(Node("x", "rag-api"));

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
        GraphSnapshot graph = Graph(Node("svc-existing", "existing-api"));

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph();

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, []).Should().BeFalse();
    }

    [SkippableFact]
    public void WouldChangeGraphForCommit_true_when_topology_adds_nodes()
    {
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = GraphWithEdges(
            [ Node("svc-1", "api", sourceId: "azurerm_app_service.main", sourceType: "Terraform"), Node("ds-1", "sql", sourceId: "azurerm_mssql_server.main", sourceType: "Terraform") ],
            [ new GraphEdge { EdgeId = "existing-edge", FromNodeId = "svc-1", ToNodeId = "ds-1", EdgeType = GraphEdgeTypes.ConnectsTo, Label = RelationshipType.ReadsFrom.ToString() } ]);

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-1", "ds-1")), resultId: "r1", taskId: "t1", runId: "run-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().HaveCount(1);
        merged.Edges[0].EdgeId.Should().Be("existing-edge");
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_duplicate_nodes_when_service_id_matches_graph_source_id()
    {
        GraphSnapshot graph = Graph(Node("svc-1", "api", sourceId: "azurerm_app_service.main", sourceType: "Terraform"));

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
        GraphSnapshot graph = Graph(
            Node("svc-1", "api", sourceId: "azurerm_app_service.main", sourceType: "Terraform"),
            Node("ds-1", "sql", sourceId: "azurerm_mssql_server.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("azurerm_app_service.main")), resultId: "r1", taskId: "t1", runId: "run-1");

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

        GraphSnapshot graph = Graph(Node("t1", "vm-graph", properties: new Dictionary<string, string> { ["resourceId"] = vmResourceId }));

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

        GraphSnapshot graph = Graph(
            Node("t1", "vm-graph", properties: new Dictionary<string, string> { ["resourceId"] = vmResourceId }),
            Node("ds-1", "sql", sourceId: "azurerm_mssql_server.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(vmResourceId)), resultId: "r1", taskId: "t1", runId: "run-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_relationships_use_renamed_service_labels()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode(nodeId: "ds-sql", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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
        GraphSnapshot graph = Graph(new GraphNode { NodeId = "req-1", NodeType = GraphNodeTypes.Requirement, Label = "api" });

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-1", "ds-1")), resultId: "r1", taskId: "t1", runId: "run-1");

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "t1"),
            Node("blob-1", "artifacts", category: GraphTopologyCategories.Storage, sourceId: "azurerm_storage_account.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-artifacts")), resultId: "r1", taskId: "t1", runId: "run-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "blob-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_does_not_block_new_datastores_when_non_topology_node_shares_label()
    {
        GraphSnapshot graph = Graph(new GraphNode { NodeId = "req-1", NodeType = GraphNodeTypes.Requirement, Label = "sql" });

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph();

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

        AgentResult secondTopology = TopologyResult(RelationshipProposal(Relationship("renamed-api")), resultId: "r2", taskId: "t2", runId: "run-1");

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
        GraphSnapshot graph = Graph();

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

        AgentResult secondTopology = TopologyResult(RelationshipProposal(Relationship(targetId: "renamed-sql")), resultId: "r2", taskId: "t2", runId: "run-1");

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
        GraphSnapshot graph = Graph();

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

        AgentResult followUpTopology = TopologyResult(RelationshipProposal(Relationship("renamed-api")), resultId: "r2", taskId: "t2", runId: "run-1");

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api"),
            ComputeNode(nodeId: "svc-idp", label: "idp", sourceId: "azurerm_active_directory.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "idp", relationshipType: RelationshipType.AuthenticatesWith)), resultId: "r1", taskId: "t1", runId: "run-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "svc-idp" &&
            e.EdgeType == GraphEdgeTypes.DependsOn);
    }

    [SkippableFact]
    public void WouldChangeGraphForCommit_true_when_topology_adds_edges_only_on_inventoried_graph()
    {
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "svc-api"), DataNode(nodeId: "ds-sql"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship()), resultId: "r1", taskId: "t1", runId: "run-1");

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, [topology]).Should().BeTrue();
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_for_relationship_only_proposals_referencing_agent_proposed_graph_endpoints()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("worker")), resultId: "r1", taskId: "t1", runId: "run-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-worker" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [SkippableFact]
    public void WithMergedTopologyProposals_adds_edges_when_renamed_service_overlay_targets_agent_proposed_node_on_mixed_graph()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-api", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)),
            DataNode());

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph();

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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

        AgentResult inventoriedRelationship = TopologyResult(RelationshipProposal(Relationship()), resultId: "topology-2");

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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

        AgentResult cost = ResultFor(AgentType.Cost, ProposalFor(AgentType.Cost, Relationship("renamed-api")), resultId: "cost-1");

        AgentResult[] results = [topology, cost];
        CrossAgentProposalConsistencyGate.ApplyToResults(results);

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, results).Should().BeTrue();
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_from_cost_relationship_only_when_topology_declares_rename_overlay()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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

        AgentResult cost = ResultFor(AgentType.Cost, ProposalFor(AgentType.Cost, Relationship("renamed-api")), resultId: "cost-1");

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
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
    public void WithMergedTopologyProposals_materializes_greenfield_edges_when_compliance_declares_endpoints_and_relationship()
    {
        GraphSnapshot graph = Graph();

        AgentResult compliance = new()
        {
            ResultId = "compliance-greenfield-1",
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
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "sql",
                        DatastoreId = "ds-sql",
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
            }
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([compliance]);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [compliance]);

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, [compliance]).Should().BeTrue();
        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "ds-sql" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_topology_node_when_cost_rename_alias_precedes_topology_in_result_order()
    {
        GraphSnapshot graph = new GraphSnapshot { Nodes = [], Edges = [] };

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
                        ServiceId = "svc-1",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        AgentResult cost = new()
        {
            ResultId = "cost-1",
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
                ],
            },
        };

        CrossAgentProposalConsistencyGate.ApplyToResults([topology, cost]);

        AgentResult[] results = [cost, topology];

        AgentTopologyProposalGraphMerge.WouldChangeGraphForCommit(graph, results).Should().BeTrue();

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);

        merged.Nodes.Should().ContainSingle(n => n.NodeId == "svc-1" && n.Label == "api");
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_overlay_service_id_has_surrounding_whitespace()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
    public void CrossAgent_then_merge_keeps_edge_when_follow_up_rename_ServiceId_has_surrounding_whitespace()
    {
        // TryClaim trims ServiceId, but IsRenameAliasService compared raw ids — so CrossAgent dropped the padded
        // rename overlay and merge then lost relationships keyed by the new label.
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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

        AgentResult cost = new()
        {
            ResultId = "cost-1",
            AgentType = AgentType.Cost,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
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

        CrossAgentProposalConsistencyGate.ApplyToResults([topology, cost]);

        cost.ProposedChanges!.AddedServices.Should().ContainSingle(s => s.ServiceName == "renamed-api");
        cost.ProposedChanges.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == "renamed-api" && r.TargetId == "sql");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology, cost]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_overlay_precedes_relationship_only_follow_up()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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

        AgentResult followUp = ResultFor(AgentType.Compliance, ProposalFor(AgentType.Compliance, Relationship("renamed-api")), resultId: "compliance-2");

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
        GraphSnapshot graph = Graph(
            ComputeNode(),
            Node("blob-1", "artifacts", category: GraphTopologyCategories.Storage, sourceId: "azurerm_storage_account.main", sourceType: "Terraform"));

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
    public void WithMergedTopologyProposals_adds_edges_when_compliance_service_rename_uses_storage_synthetic_datastore_id()
    {
        // Merge gate indexes ds-{label} for storage nodes type-agnostically. Agents sometimes put that key on
        // AddedServices.ServiceId instead of AddedDatastores — gate keeps the rename, but NodeMatchesService
        // only accepted svc-{label}, so aliases were skipped and the edge dropped.
        GraphSnapshot graph = Graph(
            ComputeNode(),
            Node("blob-1", "artifacts", category: GraphTopologyCategories.Storage, sourceId: "azurerm_storage_account.main", sourceType: "Terraform"));

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
                        ServiceName = "renamed-artifacts",
                        ServiceId = "ds-artifacts",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
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

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [compliance]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedServices.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == "api" && r.TargetId == "renamed-artifacts");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [compliance]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "blob-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_compliance_rename_follows_topology_service_claim_in_same_batch()
    {
        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

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
        GraphSnapshot graph = Graph(ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "svc-worker", label: "worker", sourceId: "ProposedChanges", sourceType: nameof(AgentType.Topology)));

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

        GraphSnapshot graph = Graph(
            ComputeNode(sourceId: null, sourceType: null, properties: new Dictionary<string, string> { ["resourceId"] = rawArmId }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(paddedArmId)), resultId: "topology-1");

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

        GraphSnapshot graph = Graph(
            ComputeNode(sourceId: null, sourceType: null, properties: new Dictionary<string, string> { ["resourceId"] = paddedArmId }),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(rawArmId)), resultId: "topology-1");

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

        GraphSnapshot graph = Graph(ComputeNode(sourceId: paddedTerraformSourceId), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(rawTerraformSourceId)), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_rename_overlay_uses_terraform_source_id_and_graph_source_id_has_whitespace()
    {
        // Indexing/merge-gate trim SourceId, but NodeMatchesService compared raw node.SourceId to the trimmed
        // manifest ServiceId — so rename overlays failed while direct Terraform relationship keys still worked.
        const string rawTerraformSourceId = ComputeSourceId;
        const string paddedTerraformSourceId = $"  {rawTerraformSourceId}  ";

        GraphSnapshot graph = Graph(ComputeNode(sourceId: paddedTerraformSourceId), DataNode());

        AgentResult topology = TopologyResult(
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = rawTerraformSourceId,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = DataLabel,
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            },
            resultId: "topology-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == "renamed-api" && r.TargetId == DataLabel);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == ComputeNodeId &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_adds_edges_when_rename_overlay_service_id_is_terraform_address_on_label()
    {
        // tf show JSON puts the Terraform address on Label and the declaration id on SourceId. The merge gate
        // indexes Label, so ServiceId = address is known — but NodeMatchesService never compared ServiceId to Label.
        const string terraformAddress = "azurerm_linux_web_app.app";
        const string declarationId = "decl-tf-show-json-1";
        const string armId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf";

        GraphSnapshot graph = Graph(
            Node(
                "obj-app",
                terraformAddress,
                GraphTopologyCategories.Compute,
                TerraformSourceType,
                declarationId,
                new Dictionary<string, string> { ["tf.id"] = armId }),
            DataNode());

        AgentResult topology = TopologyResult(
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = "renamed-api",
                        ServiceId = terraformAddress,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "renamed-api",
                        TargetId = DataLabel,
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            },
            resultId: "topology-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == "renamed-api" && r.TargetId == DataLabel);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "obj-app" &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_name_is_terraform_source_id_and_relationship_uses_synthetic()
    {
        // Agents sometimes copy the inventoried Terraform address into ServiceName. The merge gate then
        // treats svc-{address} as a known endpoint, but graph merge only aliases svc-{label} unless the
        // proposed name is recognized as the same node.
        const string syntheticFromTerraformSourceId = $"svc-{ComputeSourceId}";

        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult topology = TopologyResult(
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceName = ComputeSourceId,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    Relationship(sourceId: syntheticFromTerraformSourceId, targetId: DataLabel)
                ]
            },
            resultId: "topology-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == syntheticFromTerraformSourceId && r.TargetId == DataLabel);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == ComputeNodeId &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_name_is_terraform_source_id_and_relationship_uses_synthetic()
    {
        const string syntheticFromTerraformSourceId = $"ds-{DataSourceId}";

        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult topology = TopologyResult(
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = DataSourceId,
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    Relationship(sourceId: ComputeLabel, targetId: syntheticFromTerraformSourceId)
                ]
            },
            resultId: "topology-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == ComputeLabel && r.TargetId == syntheticFromTerraformSourceId);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == ComputeNodeId &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_name_is_synthetic_label_and_relationship_uses_service_id()
    {
        // Agents often emit ServiceName as svc-{label}. The merge gate treats that synthetic as inventoried,
        // but overlay matching only treats ServiceId (not ServiceName) as svc-{label}. The extra ServiceId
        // alias is then never attached, and graph merge drops the edge the gate kept.
        const string syntheticFromLabel = $"svc-{ComputeLabel}";
        const string proposedServiceId = "cost-alias-api";

        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult cost = ResultFor(
            AgentType.Cost,
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = proposedServiceId,
                        ServiceName = syntheticFromLabel,
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedRelationships =
                [
                    Relationship(sourceId: proposedServiceId, targetId: DataLabel)
                ]
            },
            resultId: "cost-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == proposedServiceId && r.TargetId == DataLabel);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [cost]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == ComputeNodeId &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_name_is_synthetic_label_and_relationship_uses_datastore_id()
    {
        const string syntheticFromLabel = $"ds-{DataLabel}";
        const string proposedDatastoreId = "cost-alias-sql";

        GraphSnapshot graph = Graph(ComputeNode(), DataNode());

        AgentResult cost = ResultFor(
            AgentType.Cost,
            new AgentTopologyProposal
            {
                SourceAgent = AgentType.Cost,
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = proposedDatastoreId,
                        DatastoreName = syntheticFromLabel,
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ],
                AddedRelationships =
                [
                    Relationship(sourceId: ComputeLabel, targetId: proposedDatastoreId)
                ]
            },
            resultId: "cost-1");

        IReadOnlyList<AgentResult> kept = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [cost]);

        kept.Should().ContainSingle();
        kept[0].ProposedChanges!.AddedRelationships.Should().ContainSingle(r =>
            r.SourceId == ComputeLabel && r.TargetId == proposedDatastoreId);

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [cost]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == ComputeNodeId &&
            e.ToNodeId == DataNodeId &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_node_has_missing_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            Node("ds-1", "sql", sourceId: "azurerm_mssql_server.main", sourceType: "Terraform"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sql")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_datastore_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ds-1", label: "sql", sourceId: "azurerm_mssql_server.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sql")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_sql_managed_instance_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mi-1", label: "sqlmi", sourceId: "azurerm_sql_managed_instance.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-sqlmi")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mi-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_app_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-api")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_management_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "apim-1", label: "apim", sourceId: "azurerm_api_management.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-apim")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "apim-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_static_site_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "web-1", label: "frontend", sourceId: "azurerm_static_site.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-frontend")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "web-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_signalr_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "signalr-1", label: "realtime", sourceId: "azurerm_signalr_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-realtime")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "signalr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_logic_app_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "logic-1", label: "workflow", sourceId: "azurerm_logic_app_workflow.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-workflow")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "logic-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_key_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "kv-1", label: "secrets", sourceId: "azurerm_key_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-secrets")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "kv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_plan_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "plan-1", label: "hosting", sourceId: "azurerm_service_plan.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-hosting")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "plan-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_spring_cloud_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "spring-1", label: "backend", sourceId: "azurerm_spring_cloud_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-backend")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "spring-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_search_service_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "search-1", label: "catalog", sourceId: "azurerm_search_service.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-catalog")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "search-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_servicebus_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sb-1", label: "orders", sourceId: "azurerm_servicebus_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-orders")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_eventhub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "eh-1", label: "events", sourceId: "azurerm_eventhub_namespace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-events")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "eh-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_container_registry_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "acr-1", label: "acr", sourceId: "azurerm_container_registry.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-acr")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "acr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cognitive_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-openai")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "cog-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_service_fabric_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sf-1", label: "fabric", sourceId: "azurerm_service_fabric_cluster.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-fabric")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_synapse_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "syn-1", label: "synapse", sourceId: "azurerm_synapse_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-synapse")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "syn-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_application_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "agw-1", label: "gateway", sourceId: "azurerm_application_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gateway")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "agw-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_factory_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adf-1", label: "etl", sourceId: "azurerm_data_factory.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-etl")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "adf-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_linux_virtual_machine_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vm-1", label: "worker", sourceId: "azurerm_linux_virtual_machine.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-worker")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vm-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mariadb_server_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mdb-1", label: "mariadb", sourceId: "azurerm_mariadb_server.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-mariadb")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mdb-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_batch_account_node_has_storage_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            Node("batch-1", "batch", category: GraphTopologyCategories.Storage, sourceId: "azurerm_batch_account.main", sourceType: "Terraform"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-batch")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "batch-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_machine_learning_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ml-1", label: "ml", sourceId: "azurerm_machine_learning_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ml")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ml-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_traffic_manager_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "tm-1", label: "traffic", sourceId: "azurerm_traffic_manager_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-traffic")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "tm-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_databricks_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "dbx-1", label: "lakehouse", sourceId: "azurerm_databricks_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-lakehouse")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "dbx-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_load_balancer_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(DataNode(nodeId: "lb-1", label: "public", sourceId: "azurerm_lb.main"), DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-public")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_kusto_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "kusto-1", label: "logs", sourceId: "azurerm_kusto_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-logs")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "kusto-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cdn_frontdoor_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fd-1", label: "edge", sourceId: "azurerm_cdn_frontdoor_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fd-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cdn_profile_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cdn-1", label: "edge", sourceId: "azurerm_cdn_profile.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "cdn-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_app_configuration_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "appcfg-1", label: "config", sourceId: "azurerm_app_configuration.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-config")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "appcfg-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_firewall_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fw-1", label: "perimeter", sourceId: "azurerm_firewall.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-perimeter")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fw-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_netapp_volume_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "netapp-1", label: "files", sourceId: "azurerm_netapp_volume.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-files")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "netapp-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_container_group_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cg-1", label: "worker", sourceId: "azurerm_container_group.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-worker")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "cg-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_recovery_services_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "rsv-1", label: "backup", sourceId: "azurerm_recovery_services_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-backup")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "rsv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_express_route_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "er-1", label: "wan", sourceId: "azurerm_express_route_circuit.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-wan")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "er-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_private_endpoint_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pe-1", label: "storage-pe", sourceId: "azurerm_private_endpoint.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-storage-pe")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pe-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_automation_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "aa-1", label: "runbooks", sourceId: "azurerm_automation_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-runbooks")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "aa-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_log_analytics_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "law-1", label: "logs", sourceId: "azurerm_log_analytics_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-logs")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "law-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_log_analytics_workspace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "law-1", label: "logs", sourceId: "azurerm_log_analytics_workspace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "law-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_virtual_network_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vng-1", label: "vpn", sourceId: "azurerm_virtual_network_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-vpn")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vng-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_application_insights_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ai-1", label: "telemetry", sourceId: "azurerm_application_insights.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-telemetry")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ai-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_application_insights_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "ai-1", label: "telemetry", sourceId: "azurerm_application_insights.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-telemetry")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "ai-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dns_zone_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dns-1", label: "corp", sourceId: "azurerm_dns_zone.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-corp")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dns-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_managed_disk_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "disk-1", label: "data-disk", sourceId: "azurerm_managed_disk.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-data-disk")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "disk-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_bastion_host_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "bastion-1", label: "jump", sourceId: "azurerm_bastion_host.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-jump")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "bastion-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_stream_analytics_job_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "asa-1", label: "events", sourceId: "azurerm_stream_analytics_job.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-events")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "asa-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_nat_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "nat-1", label: "egress", sourceId: "azurerm_nat_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-egress")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "nat-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_iothub_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "iot-1", label: "devices", sourceId: "azurerm_iothub.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-devices")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "iot-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_entra_id_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "idp-1", label: "idp", sourceId: "azuread_application.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-idp")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "idp-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_powerbi_embedded_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pbi-1", label: "bi", sourceId: "azurerm_powerbi_embedded.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-bi")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pbi-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_connection_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "conn-1", label: "sharepoint", sourceId: "azurerm_api_connection.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sharepoint")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "conn-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_eventgrid_topic_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "eg-1", label: "orders", sourceId: "azurerm_eventgrid_topic.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-orders")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "eg-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_monitor_action_group_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "mag-1", label: "alerts", sourceId: "azurerm_monitor_action_group.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-alerts")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "mag-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_redis_enterprise_cache_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "redis-1", label: "cache", sourceId: "azurerm_redis_enterprise_cache.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-cache")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "redis-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_communication_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "acs-1", label: "sms", sourceId: "azurerm_communication_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sms")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "acs-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_maps_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "maps-1", label: "geo", sourceId: "azurerm_maps_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-geo")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "maps-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_web_pubsub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "wps-1", label: "realtime", sourceId: "azurerm_web_pubsub.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-realtime")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "wps-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_share_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "share-1", label: "partner", sourceId: "azurerm_data_share.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-partner")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "share-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_healthbot_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "hb-1", label: "carebot", sourceId: "azurerm_healthbot_healthbot.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-carebot")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "hb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_digital_twins_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "dt-1", label: "factory", sourceId: "azurerm_digital_twins_instance.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-factory")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "dt-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_notification_hub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "nh-1", label: "push", sourceId: "azurerm_notification_hub_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-push")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "nh-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_media_services_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ams-1", label: "stream", sourceId: "azurerm_media_services_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-stream")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ams-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_fluid_relay_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "fr-1", label: "collab", sourceId: "azurerm_fluid_relay_server.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-collab")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "fr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_elastic_san_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "esan-1", label: "vol", sourceId: "azurerm_elastic_san.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-vol")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "esan-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_orbital_spacecraft_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "orb-1", label: "sat", sourceId: "azurerm_orbital_spacecraft.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-sat")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "orb-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_healthcare_workspace_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "hc-1", label: "fhir", sourceId: "azurerm_healthcare_workspace.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-fhir")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "hc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_virtual_hub_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vh-1", label: "wan", sourceId: "azurerm_virtual_hub.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-wan")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vh-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_managed_lustre_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ml-1", label: "hpc", sourceId: "azurerm_managed_lustre_file_system.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-hpc")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ml-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_lab_service_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "lab-1", label: "devbox", sourceId: "azurerm_lab_service.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-devbox")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lab-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_video_indexer_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "vi-1", label: "media", sourceId: "azurerm_video_indexer.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-media")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "vi-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_load_test_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "lt-1", label: "perf", sourceId: "azurerm_load_test.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-perf")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "lt-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_hpc_cache_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "hpc-1", label: "scratch", sourceId: "azurerm_hpc_cache.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-scratch")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "hpc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dynatrace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dt-1", label: "apm", sourceId: "azurerm_dynatrace_monitor.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-apm")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dt-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_backup_vault_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "bv-1", label: "archive", sourceId: "azurerm_backup_vault.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-archive")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "bv-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_kubernetes_fleet_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "kf-1", label: "fleet", sourceId: "azurerm_kubernetes_fleet_manager.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-fleet")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "kf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mobile_network_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mn-1", label: "ran", sourceId: "azurerm_mobile_network.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ran")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mn-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_relay_namespace_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "relay-1", label: "bridge", sourceId: "azurerm_relay_namespace.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-bridge")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "relay-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dev_center_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adc-1", label: "portal", sourceId: "azurerm_dev_center.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-portal")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "adc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_api_center_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "apc-1", label: "catalog", sourceId: "azurerm_api_center.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-catalog")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "apc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_graph_account_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ga-1", label: "identity", sourceId: "azurerm_graph_account.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-identity")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ga-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_dashboard_grafana_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "graf-1", label: "metrics", sourceId: "azurerm_dashboard_grafana.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-metrics")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "graf-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_fabric_capacity_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "fab-1", label: "analytics", sourceId: "azurerm_fabric_capacity.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-analytics")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "fab-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_chaos_studio_target_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "chaos-1", label: "resilience", sourceId: "azurerm_chaos_studio_target.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-resilience")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "chaos-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_confidential_ledger_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "cl-1", label: "ledger", sourceId: "azurerm_confidential_ledger.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-ledger")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "cl-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_stack_hci_cluster_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "hci-1", label: "edge", sourceId: "azurerm_stack_hci_cluster.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edge")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "hci-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_pinecone_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "pc-1", label: "vectors", sourceId: "azurerm_pinecone.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-vectors")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "pc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_voice_services_gateway_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "vs-1", label: "telephony", sourceId: "azurerm_voice_services_communications_gateway.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-telephony")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "vs-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_mongo_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "mc-1", label: "documents", sourceId: "azurerm_mongo_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-documents")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "mc-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_workloads_sap_discovery_site_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "sap-1", label: "discovery", sourceId: "azurerm_workloads_sap_discovery_site.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-discovery")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "sap-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_elastic_cloud_elasticsearch_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "es-1", label: "search", sourceId: "azurerm_elastic_cloud_elasticsearch.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-search")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "es-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_palo_alto_local_rulestack_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "pa-1", label: "firewall", sourceId: "azurerm_palo_alto_local_rulestack.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-firewall")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "pa-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_neptune_cluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "np-1", label: "graph", sourceId: "azurerm_neptune_cluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-graph")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "np-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_verifiedaccess_instance_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "va-1", label: "ztna", sourceId: "azurerm_verifiedaccess_instance.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-ztna")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "va-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_oracle_cloud_vmcluster_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "ora-1", label: "oracle", sourceId: "azurerm_oracle_cloud_vmcluster.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-oracle")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ora-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_workloads_orchestrator_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "wo-1", label: "orchestrator", sourceId: "azurerm_workloads_orchestrator.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-orchestrator")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "wo-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_oracle_autonomous_database_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "oad-1", label: "autonomous", sourceId: "azurerm_oracle_autonomous_database.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-autonomous")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "oad-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_extended_location_custom_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "el-1", label: "edgezone", sourceId: "azurerm_extended_location_custom.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-edgezone")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "el-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_storage_mover_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sm-1", label: "mover", sourceId: "azurerm_storage_mover.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-mover")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "sm-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_kubernetes_configuration_flux_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "flux-1", label: "gitops", sourceId: "azurerm_kubernetes_configuration_flux.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gitops")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "flux-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_storage_data_lake_gen2_path_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "adls-1", label: "lakepath", sourceId: "azurerm_storage_data_lake_gen2_path.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-lakepath")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "adls-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_site_recovery_fabric_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sr-1", label: "fabric", sourceId: "azurerm_site_recovery_fabric.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-fabric")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "sr-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_collection_endpoint_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dce-1", label: "logs", sourceId: "azurerm_data_collection_endpoint.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dce-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_data_collection_rule_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dcr-1", label: "logs", sourceId: "azurerm_monitor_data_collection_rule.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-logs")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dcr-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cognitive_services_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_services_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-openai")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "cog-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cognitive_account_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "cog-1", label: "openai", sourceId: "azurerm_cognitive_account.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-openai")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "cog-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_cognitive_deployment_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "dep-1", label: "gpt4", sourceId: "azurerm_cognitive_deployment.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-gpt4")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "dep-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_storage_blob_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "blob-1", label: "artifact", sourceId: "azurerm_storage_blob.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-artifact")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "blob-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_active_directory_node_has_data_category_but_synthetic_service_id_used()
    {
        GraphSnapshot graph = Graph(
            DataNode(nodeId: "aad-1", label: "idp", sourceId: "azurerm_active_directory.main"),
            DataNode());

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship("svc-idp")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "aad-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_storage_share_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "share-1", label: "files", sourceId: "azurerm_storage_share.main"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "ds-files")), resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "share-1");
    }

    [Fact]
    public void WithMergedTopologyProposals_materializes_edge_when_sql_server_node_has_compute_category_but_synthetic_datastore_id_used()
    {
        GraphSnapshot graph = Graph(
            ComputeNode(),
            ComputeNode(nodeId: "sql-1", label: "legacy-sql", sourceId: "azurerm_sql_server.main"));

        AgentResult topology = TopologyResult(
            RelationshipProposal(Relationship(targetId: "ds-legacy-sql")),
            resultId: "topology-1");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        merged.Edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "sql-1");
    }
}
