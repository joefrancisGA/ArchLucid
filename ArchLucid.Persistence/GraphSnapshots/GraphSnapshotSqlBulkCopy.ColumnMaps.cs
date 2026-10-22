using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GraphSnapshots;

internal static partial class GraphSnapshotSqlBulkCopy
{
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
