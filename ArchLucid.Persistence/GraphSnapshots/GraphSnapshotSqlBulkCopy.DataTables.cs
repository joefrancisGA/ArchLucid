using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.GraphSnapshots;

internal static partial class GraphSnapshotSqlBulkCopy
{
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
}
