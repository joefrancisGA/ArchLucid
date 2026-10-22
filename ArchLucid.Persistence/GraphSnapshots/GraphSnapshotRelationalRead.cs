using System.Data;

using ArchLucid.Persistence.Repositories;

using Dapper;

namespace ArchLucid.Persistence.GraphSnapshots;

/// <summary>Loads graph snapshot nodes, warnings, and indexed edges from relational tables.</summary>
/// <remarks>
///     When <c>dbo.GraphSnapshotEdges</c> has rows, matching <c>EdgesJson</c> entries are merged per <c>EdgeId</c> for
///     label and properties that are absent relationally (legacy enrichment until all edge metadata is backfilled
///     relationally). Relational values win when present. <c>EdgesJson</c> is taken from the optional merge row when
///     non-empty; otherwise it is read from <c>dbo.GraphSnapshots</c> so header-only callers still merge correctly when
///     edge property rows exist only for some edges.
/// </remarks>
internal static partial class GraphSnapshotRelationalRead
{
    /// <summary>Identity row for a graph snapshot header (no JSON columns — avoids loading large NVARCHAR(MAX) payloads).</summary>
    internal sealed record GraphSnapshotHeaderRow(
        Guid GraphSnapshotId,
        Guid ContextSnapshotId,
        Guid RunId,
        DateTime CreatedUtc);

    /// <summary>Hydrates from a full storage row (integration tests and callers that already materialized JSON columns).</summary>
    public static Task<GraphSnapshot> HydrateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        GraphSnapshotStorageRow row,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(row);
        GraphSnapshotHeaderRow header = new(row.GraphSnapshotId, row.ContextSnapshotId, row.RunId, row.CreatedUtc);

        return HydrateAsync(connection, transaction, header, jsonRowForMerge: row, ct);
    }

    /// <summary>
    ///     Hydrates using relational slices; when relational edges exist, <c>EdgesJson</c> is merged per <c>EdgeId</c>
    ///     for missing relational label/properties. Non-empty <paramref name="jsonRowForMerge" />.<c>EdgesJson</c>
    ///     avoids an extra query; when omitted or empty, <c>EdgesJson</c> is read from <c>dbo.GraphSnapshots</c>.
    /// </summary>
    public static async Task<GraphSnapshot> HydrateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        GraphSnapshotHeaderRow header,
        GraphSnapshotStorageRow? jsonRowForMerge,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(header);

        Guid graphSnapshotId = header.GraphSnapshotId;

        // Load slices directly instead of probing COUNT(1) first: an empty result carries the same
        // "no relational rows" signal a count would, without three extra round trips per hydrate.
        List<GraphNode> nodes = await LoadNodesRelationalAsync(connection, transaction, graphSnapshotId, ct);
        List<GraphNode>? nodesOverride = nodes.Count > 0 ? nodes : null;

        List<string> warnings = await LoadStringColumnRelationalAsync(
            connection,
            transaction,
            """
            SELECT WarningText AS Item
            FROM dbo.GraphSnapshotWarnings
            WHERE GraphSnapshotId = @GraphSnapshotId
            ORDER BY SortOrder;
            """,
            graphSnapshotId,
            ct);
        List<string>? warningsOverride = warnings.Count > 0 ? warnings : null;

        List<GraphEdge> edges = await LoadEdgesRelationalAsync(
            connection,
            transaction,
            graphSnapshotId,
            jsonRowForMerge,
            ct);
        List<GraphEdge>? edgesOverride = edges.Count > 0 ? edges : null;

        GraphSnapshotStorageRow syntheticHeader = new()
        {
            GraphSnapshotId = header.GraphSnapshotId,
            ContextSnapshotId = header.ContextSnapshotId,
            RunId = header.RunId,
            CreatedUtc = header.CreatedUtc,
            NodesJson = "[]",
            EdgesJson = "[]",
            WarningsJson = "[]"
        };

        return GraphSnapshotStorageMapper.ToSnapshot(syntheticHeader, nodesOverride, edgesOverride, warningsOverride);
    }

    private static async Task<List<string>> LoadStringColumnRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        string sql,
        Guid graphSnapshotId,
        CancellationToken ct)
    {
        IEnumerable<string> rows = await connection.QueryAsync<string>(
            new CommandDefinition(
                sql,
                new { GraphSnapshotId = graphSnapshotId },
                transaction,
                cancellationToken: ct));

        return rows.ToList();
    }
}
