using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Repositories;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GraphSnapshots;

/// <summary>
///     <see cref="SqlBulkCopy" /> helpers for graph snapshot child tables (avoids dynamic SQL and the SQL Server
///     ~2100-parameter limit).
/// </summary>
internal static class GraphSnapshotSqlBulkCopy
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

    private static DataTable BuildNodeDataTable(
        GraphSnapshot snapshot,
        ScopeContext scope,
        IReadOnlyList<(Guid RowId, GraphNode Node, int SortOrder)> planned)
    {
        DataTable table = new();

        table.Columns.Add("GraphNodeRowId", typeof(Guid));
        table.Columns.Add("GraphSnapshotId", typeof(Guid));
        table.Columns.Add("SortOrder", typeof(int));
        table.Columns.Add("TenantId", typeof(Guid));
        table.Columns.Add("WorkspaceId", typeof(Guid));
        table.Columns.Add("ScopeProjectId", typeof(Guid));
        table.Columns.Add("NodeId", typeof(string));
        table.Columns.Add("NodeType", typeof(string));
        table.Columns.Add("Label", typeof(string));
        DataColumn categoryCol = table.Columns.Add("Category", typeof(string));
        categoryCol.AllowDBNull = true;
        DataColumn sourceTypeCol = table.Columns.Add("SourceType", typeof(string));
        sourceTypeCol.AllowDBNull = true;
        DataColumn sourceIdCol = table.Columns.Add("SourceId", typeof(string));
        sourceIdCol.AllowDBNull = true;

        foreach ((Guid rowId, GraphNode node, int sortOrder) in planned)
        {
            DataRow row = table.NewRow();
            row["GraphNodeRowId"] = rowId;
            row["GraphSnapshotId"] = snapshot.GraphSnapshotId;
            row["SortOrder"] = sortOrder;
            row["TenantId"] = scope.TenantId;
            row["WorkspaceId"] = scope.WorkspaceId;
            row["ScopeProjectId"] = scope.ProjectId;
            row["NodeId"] = node.NodeId;
            row["NodeType"] = node.NodeType;
            row["Label"] = node.Label;
            row["Category"] = string.IsNullOrEmpty(node.Category) ? DBNull.Value : node.Category;
            row["SourceType"] = string.IsNullOrEmpty(node.SourceType) ? DBNull.Value : node.SourceType;
            row["SourceId"] = string.IsNullOrEmpty(node.SourceId) ? DBNull.Value : node.SourceId;
            table.Rows.Add(row);
        }

        return table;
    }

    private static DataTable BuildNodePropertyDataTable(
        ScopeContext scope,
        List<(Guid GraphNodeRowId, int PropertySortOrder, string PropertyKey, string PropertyValue)> flat)
    {
        DataTable table = new();

        table.Columns.Add("GraphNodeRowId", typeof(Guid));
        table.Columns.Add("PropertySortOrder", typeof(int));
        table.Columns.Add("PropertyKey", typeof(string));
        table.Columns.Add("PropertyValue", typeof(string));
        table.Columns.Add("TenantId", typeof(Guid));
        table.Columns.Add("WorkspaceId", typeof(Guid));
        table.Columns.Add("ScopeProjectId", typeof(Guid));

        foreach ((Guid graphNodeRowId, int propertySortOrder, string propertyKey, string propertyValue) in flat)
        {
            DataRow row = table.NewRow();
            row["GraphNodeRowId"] = graphNodeRowId;
            row["PropertySortOrder"] = propertySortOrder;
            row["PropertyKey"] = propertyKey;
            row["PropertyValue"] = propertyValue;
            row["TenantId"] = scope.TenantId;
            row["WorkspaceId"] = scope.WorkspaceId;
            row["ScopeProjectId"] = scope.ProjectId;
            table.Rows.Add(row);
        }

        return table;
    }

    private static DataTable BuildEdgePropertyDataTable(
        ScopeContext scope,
        List<(Guid GraphSnapshotId, string EdgeId, int PropertySortOrder, string PropertyKey, string PropertyValue)> rows)
    {
        DataTable table = new();

        table.Columns.Add("GraphSnapshotId", typeof(Guid));
        table.Columns.Add("EdgeId", typeof(string));
        table.Columns.Add("PropertySortOrder", typeof(int));
        table.Columns.Add("PropertyKey", typeof(string));
        table.Columns.Add("PropertyValue", typeof(string));
        table.Columns.Add("TenantId", typeof(Guid));
        table.Columns.Add("WorkspaceId", typeof(Guid));
        table.Columns.Add("ScopeProjectId", typeof(Guid));

        foreach ((Guid graphSnapshotId, string edgeId, int propertySortOrder, string propertyKey, string propertyValue) in
                 rows)
        {
            DataRow row = table.NewRow();
            row["GraphSnapshotId"] = graphSnapshotId;
            row["EdgeId"] = edgeId;
            row["PropertySortOrder"] = propertySortOrder;
            row["PropertyKey"] = propertyKey;
            row["PropertyValue"] = propertyValue;
            row["TenantId"] = scope.TenantId;
            row["WorkspaceId"] = scope.WorkspaceId;
            row["ScopeProjectId"] = scope.ProjectId;
            table.Rows.Add(row);
        }

        return table;
    }

    private static DataTable BuildIndexedEdgeDataTable(
        IReadOnlyList<GraphSnapshotEdgeRow> edgeRows,
        ScopeContext scope)
    {
        DataTable table = new();

        table.Columns.Add("GraphSnapshotId", typeof(Guid));
        table.Columns.Add("EdgeId", typeof(string));
        table.Columns.Add("FromNodeId", typeof(string));
        table.Columns.Add("ToNodeId", typeof(string));
        table.Columns.Add("EdgeType", typeof(string));
        table.Columns.Add("Weight", typeof(double));
        table.Columns.Add("TenantId", typeof(Guid));
        table.Columns.Add("WorkspaceId", typeof(Guid));
        table.Columns.Add("ScopeProjectId", typeof(Guid));

        foreach (GraphSnapshotEdgeRow r in edgeRows)
        {
            DataRow row = table.NewRow();
            row["GraphSnapshotId"] = r.GraphSnapshotId;
            row["EdgeId"] = r.EdgeId;
            row["FromNodeId"] = r.FromNodeId;
            row["ToNodeId"] = r.ToNodeId;
            row["EdgeType"] = r.EdgeType;
            row["Weight"] = r.Weight;
            row["TenantId"] = scope.TenantId;
            row["WorkspaceId"] = scope.WorkspaceId;
            row["ScopeProjectId"] = scope.ProjectId;
            table.Rows.Add(row);
        }

        return table;
    }

    private static DataTable BuildWarningsDataTable(Guid graphSnapshotId, IReadOnlyList<string> warnings, ScopeContext scope)
    {
        DataTable table = new();

        table.Columns.Add("GraphSnapshotId", typeof(Guid));
        table.Columns.Add("SortOrder", typeof(int));
        table.Columns.Add("WarningText", typeof(string));
        table.Columns.Add("TenantId", typeof(Guid));
        table.Columns.Add("WorkspaceId", typeof(Guid));
        table.Columns.Add("ScopeProjectId", typeof(Guid));

        for (int w = 0; w < warnings.Count; w++)
        {
            DataRow row = table.NewRow();
            row["GraphSnapshotId"] = graphSnapshotId;
            row["SortOrder"] = w;
            row["WarningText"] = warnings[w];
            row["TenantId"] = scope.TenantId;
            row["WorkspaceId"] = scope.WorkspaceId;
            row["ScopeProjectId"] = scope.ProjectId;
            table.Rows.Add(row);
        }

        return table;
    }

    private static void MapNodeColumns(SqlBulkCopy bulk)
    {
        bulk.ColumnMappings.Add("GraphNodeRowId", "GraphNodeRowId");
        bulk.ColumnMappings.Add("GraphSnapshotId", "GraphSnapshotId");
        bulk.ColumnMappings.Add("SortOrder", "SortOrder");
        bulk.ColumnMappings.Add("TenantId", "TenantId");
        bulk.ColumnMappings.Add("WorkspaceId", "WorkspaceId");
        bulk.ColumnMappings.Add("ScopeProjectId", "ScopeProjectId");
        bulk.ColumnMappings.Add("NodeId", "NodeId");
        bulk.ColumnMappings.Add("NodeType", "NodeType");
        bulk.ColumnMappings.Add("Label", "Label");
        bulk.ColumnMappings.Add("Category", "Category");
        bulk.ColumnMappings.Add("SourceType", "SourceType");
        bulk.ColumnMappings.Add("SourceId", "SourceId");
    }

    private static void MapNodePropertyColumns(SqlBulkCopy bulk)
    {
        bulk.ColumnMappings.Add("GraphNodeRowId", "GraphNodeRowId");
        bulk.ColumnMappings.Add("PropertySortOrder", "PropertySortOrder");
        bulk.ColumnMappings.Add("PropertyKey", "PropertyKey");
        bulk.ColumnMappings.Add("PropertyValue", "PropertyValue");
        bulk.ColumnMappings.Add("TenantId", "TenantId");
        bulk.ColumnMappings.Add("WorkspaceId", "WorkspaceId");
        bulk.ColumnMappings.Add("ScopeProjectId", "ScopeProjectId");
    }

    private static void MapEdgePropertyColumns(SqlBulkCopy bulk)
    {
        bulk.ColumnMappings.Add("GraphSnapshotId", "GraphSnapshotId");
        bulk.ColumnMappings.Add("EdgeId", "EdgeId");
        bulk.ColumnMappings.Add("PropertySortOrder", "PropertySortOrder");
        bulk.ColumnMappings.Add("PropertyKey", "PropertyKey");
        bulk.ColumnMappings.Add("PropertyValue", "PropertyValue");
        bulk.ColumnMappings.Add("TenantId", "TenantId");
        bulk.ColumnMappings.Add("WorkspaceId", "WorkspaceId");
        bulk.ColumnMappings.Add("ScopeProjectId", "ScopeProjectId");
    }

    private static void MapIndexedEdgeColumns(SqlBulkCopy bulk)
    {
        bulk.ColumnMappings.Add("GraphSnapshotId", "GraphSnapshotId");
        bulk.ColumnMappings.Add("EdgeId", "EdgeId");
        bulk.ColumnMappings.Add("FromNodeId", "FromNodeId");
        bulk.ColumnMappings.Add("ToNodeId", "ToNodeId");
        bulk.ColumnMappings.Add("EdgeType", "EdgeType");
        bulk.ColumnMappings.Add("Weight", "Weight");
        bulk.ColumnMappings.Add("TenantId", "TenantId");
        bulk.ColumnMappings.Add("WorkspaceId", "WorkspaceId");
        bulk.ColumnMappings.Add("ScopeProjectId", "ScopeProjectId");
    }

    private static void MapWarningColumns(SqlBulkCopy bulk)
    {
        bulk.ColumnMappings.Add("GraphSnapshotId", "GraphSnapshotId");
        bulk.ColumnMappings.Add("SortOrder", "SortOrder");
        bulk.ColumnMappings.Add("WarningText", "WarningText");
        bulk.ColumnMappings.Add("TenantId", "TenantId");
        bulk.ColumnMappings.Add("WorkspaceId", "WorkspaceId");
        bulk.ColumnMappings.Add("ScopeProjectId", "ScopeProjectId");
    }
}
