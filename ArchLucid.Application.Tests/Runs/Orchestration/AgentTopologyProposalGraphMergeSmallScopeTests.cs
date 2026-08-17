using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
public sealed class AgentTopologyProposalGraphMergeSmallScopeTests
{
    private static readonly string[] TinyNodeIds = ["a", "b", "c", "d"];

    [Fact]
    public void Exhaustive_empty_graph_and_empty_proposals()
    {
        GraphSnapshot graph = BuildGraph([]);
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, []);
        merged.Should().BeSameAs(graph);
    }

    [Fact]
    public void Exhaustive_single_node_graph_with_empty_proposals()
    {
        foreach (string nodeId in TinyNodeIds)
        {
            GraphSnapshot graph = BuildGraph([nodeId]);
            GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, []);
            merged.Nodes.Should().HaveCount(1);
        }
    }

    [Fact]
    public void Exhaustive_two_node_graphs_with_relationship_only_topology_proposal()
    {
        foreach (string left in TinyNodeIds)
        {
            foreach (string right in TinyNodeIds)
            {
                if (string.Equals(left, right, StringComparison.OrdinalIgnoreCase))
                    continue;

                GraphSnapshot graph = BuildGraph([left, right]);
                AgentResult topology = RelationshipOnlyTopology(left, right);
                GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

                merged.Edges.Should().NotBeEmpty();
                GraphMergeInvariantChecker.Check(merged).Should().BeEmpty();
            }
        }
    }

  private static GraphSnapshot BuildGraph(IReadOnlyList<string> nodeIds)
    {
        List<GraphNode> nodes = nodeIds
            .Select(static id => new GraphNode
            {
                NodeId = id,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = id,
                Category = GraphTopologyCategories.Compute,
                SourceType = "Inventory",
                SourceId = id,
            })
            .ToList();

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = [],
            Warnings = [],
        };
    }

    private static AgentResult RelationshipOnlyTopology(string sourceId, string targetId)
    {
        return new AgentResult
        {
            ResultId = $"rel-{sourceId}-{targetId}",
            TaskId = $"task-{sourceId}-{targetId}",
            RunId = Guid.NewGuid().ToString("D"),
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = sourceId,
                        TargetId = targetId,
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ]
            }
        };
    }
}
