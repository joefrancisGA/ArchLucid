using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GraphSnapshots;

/// <summary>
///     <see cref="SqlBulkCopy" /> helpers for graph snapshot child tables (avoids dynamic SQL and the SQL Server
///     ~2100-parameter limit).
/// </summary>
internal static partial class GraphSnapshotSqlBulkCopy
{
    public static List<(Guid RowId, GraphNode Node, int SortOrder)> PlanNodeRows(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<(Guid RowId, GraphNode Node, int SortOrder)> planned = [];
        planned.AddRange(snapshot.Nodes.Select((t, i) => (Guid.NewGuid(), t, i)));

        return planned;
    }

    public static async Task CopyNodeRowsAsync(
        SqlConnection connection,
        SqlTransaction? transaction,
        GraphSnapshot snapshot,
        ScopeContext scope,
        IReadOnlyList<(Guid RowId, GraphNode Node, int SortOrder)> planned,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(planned);

        if (planned.Count == 0)
            return;

        using DataTable table = BuildNodeDataTable(snapshot, scope, planned);
        using SqlBulkCopy bulk = new(connection, SqlBulkCopyOptions.Default, transaction);
        bulk.DestinationTableName = "dbo.GraphSnapshotNodes";
        MapNodeColumns(bulk);
        await bulk.WriteToServerAsync(table, ct);
    }

    public static async Task CopyNodePropertyRowsAsync(
        SqlConnection connection,
        SqlTransaction? transaction,
        ScopeContext scope,
        IReadOnlyList<(Guid RowId, GraphNode Node, int SortOrder)> planned,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(planned);

        List<(Guid GraphNodeRowId, int PropertySortOrder, string PropertyKey, string PropertyValue)> flat = [];

        foreach ((Guid rowId, GraphNode node, _) in planned)
        {
            List<KeyValuePair<string, string>> orderedProps = node.Properties
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .ToList();

            flat.AddRange(orderedProps.Select((kv, p) => (rowId, p, kv.Key, kv.Value)));
        }

        if (flat.Count == 0)
            return;

        using DataTable table = BuildNodePropertyDataTable(scope, flat);
        using SqlBulkCopy bulk = new(connection, SqlBulkCopyOptions.Default, transaction);
        bulk.DestinationTableName = "dbo.GraphSnapshotNodeProperties";
        MapNodePropertyColumns(bulk);
        await bulk.WriteToServerAsync(table, ct);
    }

    public static async Task CopyEdgePropertyRowsAsync(
        SqlConnection connection,
        SqlTransaction? transaction,
        GraphSnapshot snapshot,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(snapshot);

        List<(Guid GraphSnapshotId, string EdgeId, int PropertySortOrder, string PropertyKey, string PropertyValue)> rows =
            [];

        foreach (GraphEdge edge in snapshot.Edges)
        {
            int sort = 0;

            if (!string.IsNullOrEmpty(edge.Label))
            {
                rows.Add(
                    (
                        snapshot.GraphSnapshotId,
                        edge.EdgeId,
                        sort++,
                        GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
                        edge.Label));
            }

            List<KeyValuePair<string, string>> orderedProps = edge.Properties
                .Where(kv => !string.Equals(kv.Key, GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
                    StringComparison.Ordinal))
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .ToList();

            foreach (KeyValuePair<string, string> kv in orderedProps)
                rows.Add((snapshot.GraphSnapshotId, edge.EdgeId, sort++, kv.Key, kv.Value));
        }

        if (rows.Count == 0)
            return;

        using DataTable table = BuildEdgePropertyDataTable(scope, rows);
        using SqlBulkCopy bulk = new(connection, SqlBulkCopyOptions.Default, transaction);
        bulk.DestinationTableName = "dbo.GraphSnapshotEdgeProperties";
        MapEdgePropertyColumns(bulk);
        await bulk.WriteToServerAsync(table, ct);
    }

    public static async Task CopyIndexedEdgeRowsAsync(
        SqlConnection connection,
        SqlTransaction? transaction,
        IReadOnlyList<GraphSnapshotEdgeRow> edgeRows,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(edgeRows);

        if (edgeRows.Count == 0)
            return;

        using DataTable table = BuildIndexedEdgeDataTable(edgeRows, scope);
        using SqlBulkCopy bulk = new(connection, SqlBulkCopyOptions.Default, transaction);
        bulk.DestinationTableName = "dbo.GraphSnapshotEdges";
        MapIndexedEdgeColumns(bulk);
        await bulk.WriteToServerAsync(table, ct);
    }

    public static async Task CopyWarningRowsAsync(
        SqlConnection connection,
        SqlTransaction? transaction,
        Guid graphSnapshotId,
        IReadOnlyList<string> warnings,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(warnings);

        if (warnings.Count == 0)
            return;

        using DataTable table = BuildWarningsDataTable(graphSnapshotId, warnings, scope);
        using SqlBulkCopy bulk = new(connection, SqlBulkCopyOptions.Default, transaction);
        bulk.DestinationTableName = "dbo.GraphSnapshotWarnings";
        MapWarningColumns(bulk);
        await bulk.WriteToServerAsync(table, ct);
    }
}
