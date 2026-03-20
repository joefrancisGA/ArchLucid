using ArchiForge.ContextIngestion.Models;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.KnowledgeGraph.Builders;

public class DefaultGraphBuilder : IGraphBuilder
{
    public Task<GraphBuildResult> BuildAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        var result = new GraphBuildResult();

        var contextNodeId = $"context-{contextSnapshot.SnapshotId:N}";

        result.Nodes.Add(new GraphNode
        {
            NodeId = contextNodeId,
            NodeType = "ContextSnapshot",
            Label = $"Context Snapshot {contextSnapshot.SnapshotId:N}",
            Properties = new Dictionary<string, string>
            {
                ["snapshotId"] = contextSnapshot.SnapshotId.ToString(),
                ["runId"] = contextSnapshot.RunId.ToString()
            }
        });

        foreach (var item in contextSnapshot.CanonicalObjects)
        {
            var nodeId = $"obj-{item.ObjectId}";

            var props = new Dictionary<string, string>(item.Properties)
            {
                ["sourceType"] = item.SourceType,
                ["sourceId"] = item.SourceId
            };

            result.Nodes.Add(new GraphNode
            {
                NodeId = nodeId,
                NodeType = item.ObjectType,
                Label = item.Name,
                Properties = props
            });

            result.Edges.Add(new GraphEdge
            {
                EdgeId = Guid.NewGuid().ToString("N"),
                FromNodeId = contextNodeId,
                ToNodeId = nodeId,
                EdgeType = "CONTAINS"
            });
        }

        return Task.FromResult(result);
    }
}

