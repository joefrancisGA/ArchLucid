using ArchiForge.KnowledgeGraph.Models;
using ArchiForge.Persistence.Serialization;

namespace ArchiForge.Persistence.Repositories;

/// <summary>
/// Maps persisted graph snapshot rows to domain <see cref="GraphSnapshot"/> (shared by SQL repository and unit tests).
/// </summary>
public static class GraphSnapshotStorageMapper
{
    /// <summary>
    /// Deserializes JSON columns into a <see cref="GraphSnapshot"/>; wraps deserialization failures in a single message.
    /// </summary>
    public static GraphSnapshot ToSnapshot(GraphSnapshotStorageRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        try
        {
            return new GraphSnapshot
            {
                GraphSnapshotId = row.GraphSnapshotId,
                ContextSnapshotId = row.ContextSnapshotId,
                RunId = row.RunId,
                CreatedUtc = row.CreatedUtc,
                Nodes = JsonEntitySerializer.Deserialize<List<GraphNode>>(row.NodesJson),
                Edges = JsonEntitySerializer.Deserialize<List<GraphEdge>>(row.EdgesJson),
                Warnings = JsonEntitySerializer.Deserialize<List<string>>(row.WarningsJson),
            };
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize GraphSnapshot '{row.GraphSnapshotId}'. " +
                "The stored JSON may be corrupt or from an incompatible schema version.",
                ex);
        }
    }
}
