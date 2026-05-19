using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Decisions;
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
            ProposedChanges = new ManifestDeltaProposal
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
            ProposedChanges = new ManifestDeltaProposal
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
            ProposedChanges = new ManifestDeltaProposal
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
}
