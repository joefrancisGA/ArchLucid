using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.FailureMode" /> nodes from structured-brief failure notes (TB-2345).
/// </summary>
public static class RequestFailureModeMaterializer
{
    public static IReadOnlyList<GraphNode> MaterializeFromFailureModeNote(string? failureModeNote, Guid snapshotId)
    {
        if (string.IsNullOrWhiteSpace(failureModeNote))
            return [];

        string trimmed = failureModeNote.Trim();

        return
        [
            new GraphNode
            {
                NodeId = $"failure-mode-{snapshotId:N}",
                NodeType = GraphNodeTypes.FailureMode,
                Label = trimmed.Length <= 64 ? trimmed : $"{trimmed[..61]}...",
                SourceType = "RequestFailureMode",
                SourceId = snapshotId.ToString(),
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["note"] = trimmed,
                    ["theme"] = "continuity",
                },
            },
        ];
    }
}
