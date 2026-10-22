using System.Data;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Direct INSERT helpers for graph snapshot relational child tables (greenfield requires RLS scope columns).
/// </summary>
public static class GraphSnapshotRelationalTestInsertSupport
{
    public static async Task InsertNodeAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphNodeRowId,
        Guid graphSnapshotId,
        int sortOrder,
        string nodeId,
        string nodeType,
        string label,
        string? category,
        string? sourceType,
        string? sourceId,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string sql = """
                           INSERT INTO dbo.GraphSnapshotNodes
                           (
                               GraphNodeRowId, GraphSnapshotId, TenantId, WorkspaceId, ScopeProjectId, SortOrder,
                               NodeId, NodeType, Label, Category, SourceType, SourceId
                           )
                           VALUES
                           (
                               @GraphNodeRowId, @GraphSnapshotId, @TenantId, @WorkspaceId, @ScopeProjectId, @SortOrder,
                               @NodeId, @NodeType, @Label, @Category, @SourceType, @SourceId
                           );
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GraphNodeRowId = graphNodeRowId,
                    GraphSnapshotId = graphSnapshotId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    SortOrder = sortOrder,
                    NodeId = nodeId,
                    NodeType = nodeType,
                    Label = label,
                    Category = category,
                    SourceType = sourceType,
                    SourceId = sourceId
                },
                transaction,
                cancellationToken: ct));
    }

    public static async Task InsertEdgeAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphSnapshotId,
        string edgeId,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        double weight,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string sql = """
                           INSERT INTO dbo.GraphSnapshotEdges
                           (
                               GraphSnapshotId, TenantId, WorkspaceId, ScopeProjectId,
                               EdgeId, FromNodeId, ToNodeId, EdgeType, Weight
                           )
                           VALUES
                           (
                               @GraphSnapshotId, @TenantId, @WorkspaceId, @ScopeProjectId,
                               @EdgeId, @FromNodeId, @ToNodeId, @EdgeType, @Weight
                           );
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GraphSnapshotId = graphSnapshotId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    EdgeId = edgeId,
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = edgeType,
                    Weight = weight
                },
                transaction,
                cancellationToken: ct));
    }

    public static async Task InsertWarningAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphSnapshotId,
        int sortOrder,
        string warningText,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string sql = """
                           INSERT INTO dbo.GraphSnapshotWarnings
                           (GraphSnapshotId, TenantId, WorkspaceId, ScopeProjectId, SortOrder, WarningText)
                           VALUES (@GraphSnapshotId, @TenantId, @WorkspaceId, @ScopeProjectId, @SortOrder, @WarningText);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GraphSnapshotId = graphSnapshotId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    SortOrder = sortOrder,
                    WarningText = warningText
                },
                transaction,
                cancellationToken: ct));
    }

    public static async Task InsertEdgePropertyAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphSnapshotId,
        string edgeId,
        int propertySortOrder,
        string propertyKey,
        string propertyValue,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string sql = """
                           INSERT INTO dbo.GraphSnapshotEdgeProperties
                           (
                               GraphSnapshotId, TenantId, WorkspaceId, ScopeProjectId,
                               EdgeId, PropertySortOrder, PropertyKey, PropertyValue
                           )
                           VALUES
                           (
                               @GraphSnapshotId, @TenantId, @WorkspaceId, @ScopeProjectId,
                               @EdgeId, @PropertySortOrder, @PropertyKey, @PropertyValue
                           );
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GraphSnapshotId = graphSnapshotId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    EdgeId = edgeId,
                    PropertySortOrder = propertySortOrder,
                    PropertyKey = propertyKey,
                    PropertyValue = propertyValue
                },
                transaction,
                cancellationToken: ct));
    }

    public static async Task InsertNodePropertyAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid graphNodeRowId,
        int propertySortOrder,
        string propertyKey,
        string propertyValue,
        CancellationToken ct,
        IDbTransaction? transaction = null)
    {
        const string sql = """
                           INSERT INTO dbo.GraphSnapshotNodeProperties
                           (GraphNodeRowId, TenantId, WorkspaceId, ScopeProjectId, PropertySortOrder, PropertyKey, PropertyValue)
                           VALUES (@GraphNodeRowId, @TenantId, @WorkspaceId, @ScopeProjectId, @PropertySortOrder, @PropertyKey, @PropertyValue);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GraphNodeRowId = graphNodeRowId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    PropertySortOrder = propertySortOrder,
                    PropertyKey = propertyKey,
                    PropertyValue = propertyValue
                },
                transaction,
                cancellationToken: ct));
    }
}
