using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     Do not add named connector-family examples here; those stay in the existing example suite.
///     Algebraic merge invariants over generated <see cref="GraphSnapshot" /> and proposal lists.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalGraphMergePropertyTests
{
    [Property(Arbitrary = [typeof(GraphSnapshotArbitrary)], MaxTest = 150)]
    public void Merge_empty_proposals_returns_same_instance(GraphSnapshot graph)
    {
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, []);

        merged.Should().BeSameAs(graph);
    }

    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Merge_is_idempotent_on_the_same_proposal_batch(GraphSnapshot graph, AgentResult[] results)
    {
        GraphSnapshot once = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);
        GraphSnapshot twice = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(once, results);

        AssertStructurallyEqual(twice, once);
    }

    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Merge_is_deterministic_on_cloned_inputs(GraphSnapshot graph, AgentResult[] results)
    {
        GraphSnapshot left = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            CloneSnapshot(graph),
            CloneResults(results));
        GraphSnapshot right = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(
            CloneSnapshot(graph),
            CloneResults(results));

        AssertStructurallyEqual(left, right);
    }

    [Property(Arbitrary = [typeof(GraphSnapshotArbitrary)], MaxTest = 150)]
    public void Merge_gate_rejecting_every_proposal_leaves_the_graph_unchanged(GraphSnapshot graph)
    {
        AgentResult[] rejected =
        [
            BuildRejectedRelationshipResult("reject-0", AgentType.Topology),
            BuildRejectedRelationshipResult("reject-1", AgentType.Cost)
        ];

        IReadOnlyList<AgentResult> validated = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, rejected);

        if (validated.Count != 0)
            return;

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, rejected);

        AssertStructurallyEqual(merged, graph);
        merged.Nodes.Should().HaveCount(graph.Nodes.Count);
        merged.Edges.Should().HaveCount(graph.Edges.Count);
    }

    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Merge_output_has_no_dangling_edges(GraphSnapshot graph, AgentResult[] results)
    {
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);
        HashSet<string> nodeIds = new(merged.Nodes.Select(static n => n.NodeId), StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in merged.Edges)
        {
            nodeIds.Should().Contain(edge.FromNodeId);
            nodeIds.Should().Contain(edge.ToNodeId);
        }
    }

    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Merge_output_topology_endpoint_keys_do_not_collide_across_nodes(
        GraphSnapshot graph,
        AgentResult[] results)
    {
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);
        Dictionary<string, string> keyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in merged.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            HashSet<string> nodeKeys = new(StringComparer.OrdinalIgnoreCase);
            TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(nodeKeys, node);

            foreach (string key in nodeKeys)
            {
                if (string.IsNullOrWhiteSpace(key))
                    continue;

                if (keyToNodeId.TryGetValue(key, out string? existingNodeId))
                {
                    existingNodeId.Should().Be(node.NodeId);
                    continue;
                }

                keyToNodeId[key] = node.NodeId;
            }
        }
    }

    [Property(
        Arbitrary = [typeof(GraphSnapshotArbitrary), typeof(AgentTopologyProposalArbitrary)],
        MaxTest = 150)]
    public void Graph_json_round_trip_preserves_node_and_edge_identity(GraphSnapshot graph, AgentResult[] results)
    {
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, results);
        byte[] utf8 = GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(merged);
        GraphSnapshot? restored = GraphJsonSerialization.DeserializeSnapshot(utf8);

        restored.Should().NotBeNull();
        AssertIdentityEqual(restored!, merged);
    }

    private static AgentResult BuildRejectedRelationshipResult(string resultId, AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = resultId,
            TaskId = resultId + "-task",
            RunId = "run-property",
            AgentType = agentType,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = agentType,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "missing-source",
                        TargetId = "missing-target",
                        RelationshipType = RelationshipType.ReadsFrom
                    }
                ]
            }
        };
    }

    private static GraphSnapshot CloneSnapshot(GraphSnapshot source)
    {
        return new GraphSnapshot
        {
            SchemaVersion = source.SchemaVersion,
            GraphSnapshotId = source.GraphSnapshotId,
            ContextSnapshotId = source.ContextSnapshotId,
            RunId = source.RunId,
            CreatedUtc = source.CreatedUtc,
            Nodes = source.Nodes.Select(CloneNode).ToList(),
            Edges = source.Edges.Select(CloneEdge).ToList(),
            Warnings = [.. source.Warnings]
        };
    }

    private static List<AgentResult> CloneResults(AgentResult[] results)
    {
        return results.Select(CloneResult).ToList();
    }

    private static AgentResult CloneResult(AgentResult source)
    {
        AgentTopologyProposal? proposal = source.ProposedChanges;

        return new AgentResult
        {
            ResultId = source.ResultId,
            TaskId = source.TaskId,
            RunId = source.RunId,
            AgentType = source.AgentType,
            Confidence = source.Confidence,
            ReasoningTrace = source.ReasoningTrace,
            ProposedChanges = proposal is null
                ? null
                : new AgentTopologyProposal
                {
                    ProposalId = proposal.ProposalId,
                    SourceAgent = proposal.SourceAgent,
                    AddedServices = proposal.AddedServices.Select(CloneService).ToList(),
                    AddedDatastores = proposal.AddedDatastores.Select(CloneDatastore).ToList(),
                    AddedRelationships = proposal.AddedRelationships.Select(CloneRelationship).ToList(),
                    RequiredControls = [.. proposal.RequiredControls],
                    Warnings = [.. proposal.Warnings]
                }
        };
    }

    private static ManifestService CloneService(ManifestService source)
    {
        return new ManifestService
        {
            ServiceId = source.ServiceId,
            ServiceName = source.ServiceName,
            ServiceType = source.ServiceType,
            RuntimePlatform = source.RuntimePlatform
        };
    }

    private static ManifestDatastore CloneDatastore(ManifestDatastore source)
    {
        return new ManifestDatastore
        {
            DatastoreId = source.DatastoreId,
            DatastoreName = source.DatastoreName,
            DatastoreType = source.DatastoreType,
            RuntimePlatform = source.RuntimePlatform
        };
    }

    private static ManifestRelationship CloneRelationship(ManifestRelationship source)
    {
        return new ManifestRelationship
        {
            RelationshipId = source.RelationshipId,
            SourceId = source.SourceId,
            TargetId = source.TargetId,
            RelationshipType = source.RelationshipType
        };
    }

    private static GraphNode CloneNode(GraphNode node)
    {
        return new GraphNode
        {
            NodeId = node.NodeId,
            NodeType = node.NodeType,
            Label = node.Label,
            Category = node.Category,
            SourceType = node.SourceType,
            SourceId = node.SourceId,
            ReasoningTrace = node.ReasoningTrace,
            Properties = new Dictionary<string, string>(node.Properties, StringComparer.OrdinalIgnoreCase)
        };
    }

    private static GraphEdge CloneEdge(GraphEdge edge)
    {
        return new GraphEdge
        {
            EdgeId = edge.EdgeId,
            FromNodeId = edge.FromNodeId,
            ToNodeId = edge.ToNodeId,
            EdgeType = edge.EdgeType,
            Label = edge.Label,
            Weight = edge.Weight,
            InferenceSource = edge.InferenceSource,
            ReasoningTrace = edge.ReasoningTrace,
            Properties = new Dictionary<string, string>(edge.Properties, StringComparer.OrdinalIgnoreCase)
        };
    }

    internal static void AssertStructurallyEqual(GraphSnapshot actual, GraphSnapshot expected)
    {
        actual.GraphSnapshotId.Should().Be(expected.GraphSnapshotId);
        actual.ContextSnapshotId.Should().Be(expected.ContextSnapshotId);
        actual.RunId.Should().Be(expected.RunId);
        actual.Nodes.Select(NodeIdentity).Should().BeEquivalentTo(expected.Nodes.Select(NodeIdentity));
        actual.Edges.Select(EdgeIdentity).Should().BeEquivalentTo(expected.Edges.Select(EdgeIdentity));
    }

    private static void AssertIdentityEqual(GraphSnapshot actual, GraphSnapshot expected)
    {
        actual.GraphSnapshotId.Should().Be(expected.GraphSnapshotId);
        actual.Nodes.Select(static n => n.NodeId).Should().BeEquivalentTo(expected.Nodes.Select(static n => n.NodeId));
        actual.Edges.Select(EdgeIdentity).Should().BeEquivalentTo(expected.Edges.Select(EdgeIdentity));
    }

    private static string NodeIdentity(GraphNode node) =>
        string.Join('|', node.NodeId, node.NodeType, node.Label, node.Category, node.SourceType, node.SourceId);

    private static string EdgeIdentity(GraphEdge edge) =>
        string.Join('|', edge.FromNodeId, edge.ToNodeId, edge.EdgeType);
}
