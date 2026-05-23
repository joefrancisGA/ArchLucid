using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Builders;

public class DefaultGraphBuilder(
    IGraphNodeFactory nodeFactory,
    IGraphEdgeInferer edgeInferer)
    : IGraphBuilder
{
    public Task<GraphBuildResult> BuildAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        IReadOnlyList<CanonicalObject> canonicalObjects = contextSnapshot.CanonicalObjects;
        List<GraphNode> nodes = new(canonicalObjects.Count + 1);

        nodes.Add(CreateContextNode(contextSnapshot));

        foreach (CanonicalObject item in canonicalObjects)
        {
            GraphNode node = nodeFactory.CreateNode(item);

            if (item.Properties.TryGetValue("associatedFindings", out string? associatedFindings) &&
                associatedFindings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
            {
                node.Properties["WafAligned"] = "true";
            }
            else if (item.Properties.TryGetValue("findings", out string? findings) &&
                     findings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
            {
                node.Properties["WafAligned"] = "true";
            }

            nodes.Add(node);
        }

        IReadOnlyList<GraphEdge> inferredEdges = edgeInferer.InferEdges(contextSnapshot, nodes);

        GraphBuildResult result = new()
        {
            Nodes = nodes,
            Edges = inferredEdges.Count == 0 ? [] : [.. inferredEdges]
        };

        return Task.FromResult(result);
    }

    private static GraphNode CreateContextNode(ContextSnapshot contextSnapshot)
    {
        return new GraphNode
        {
            NodeId = $"context-{contextSnapshot.SnapshotId:N}",
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = $"Context Snapshot {contextSnapshot.SnapshotId:N}",
            SourceType = GraphNodeTypes.ContextSnapshot,
            SourceId = contextSnapshot.SnapshotId.ToString(),
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["snapshotId"] = contextSnapshot.SnapshotId.ToString(),
                ["runId"] = contextSnapshot.RunId.ToString(),
                ["projectId"] = contextSnapshot.ProjectId
            }
        };
    }
}
