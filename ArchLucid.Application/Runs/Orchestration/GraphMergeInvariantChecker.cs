using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Post-merge graph invariant checks used by runtime verification (Prompt 10) and fuzz harnesses.
/// </summary>
public static class GraphMergeInvariantChecker
{
    public static IReadOnlyList<GraphMergeInvariantViolation> Check(GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        List<GraphMergeInvariantViolation> violations = [];

        CheckDanglingEdges(graph, violations);
        CheckTopologyEndpointCollisions(graph, violations);

        return violations;
    }

    private static void CheckDanglingEdges(GraphSnapshot graph, List<GraphMergeInvariantViolation> violations)
    {
        HashSet<string> nodeIds = new(graph.Nodes.Select(static node => node.NodeId), StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!nodeIds.Contains(edge.FromNodeId))
            {
                violations.Add(
                    new GraphMergeInvariantViolation(
                        GraphMergeInvariantKinds.DanglingEdge,
                        $"Edge '{edge.EdgeId}' references missing source node '{edge.FromNodeId}'."));
            }

            if (!nodeIds.Contains(edge.ToNodeId))
            {
                violations.Add(
                    new GraphMergeInvariantViolation(
                        GraphMergeInvariantKinds.DanglingEdge,
                        $"Edge '{edge.EdgeId}' references missing target node '{edge.ToNodeId}'."));
            }
        }
    }

    private static void CheckTopologyEndpointCollisions(GraphSnapshot graph, List<GraphMergeInvariantViolation> violations)
    {
        Dictionary<string, string> keyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            HashSet<string> nodeKeys = new(StringComparer.OrdinalIgnoreCase);
            TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(nodeKeys, node);

            foreach (string key in nodeKeys)
            {
                if (string.IsNullOrWhiteSpace(key))
                    continue;

                if (keyToNodeId.TryGetValue(key, out string? existingNodeId)
                    && !string.Equals(existingNodeId, node.NodeId, StringComparison.OrdinalIgnoreCase))
                {
                    violations.Add(
                        new GraphMergeInvariantViolation(
                            GraphMergeInvariantKinds.TopologyEndpointCollision,
                            $"Topology endpoint key '{key}' maps to both '{existingNodeId}' and '{node.NodeId}'."));
                }
                else
                {
                    keyToNodeId[key] = node.NodeId;
                }
            }
        }
    }
}

public enum GraphMergeInvariantKinds
{
    DanglingEdge = 1,
    TopologyEndpointCollision = 2,
}

public readonly record struct GraphMergeInvariantViolation(GraphMergeInvariantKinds Kind, string Message);
