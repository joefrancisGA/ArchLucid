using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;

using Dapper;

using System.Data;
using System.Text;

namespace ArchLucid.Persistence.GraphSnapshots;

/// <summary>
///     Chunked multi-row INSERT helpers for graph snapshot persistence (avoids per-row round-trips and stays under SQL
///     Server's parameter cap (~2100 parameters per batch)).
/// </summary>
internal static class GraphSnapshotSqlBulkInsert
{
    /// <summary>12 parameters per node row — keep chunk small enough for SQL Server parameter limits.</summary>
    internal const int GraphSnapshotNodesChunkSize = 150;

    /// <summary>8 parameters per edge-property row.</summary>
    internal const int GraphSnapshotEdgePropertiesChunkSize = 200;

    /// <summary>7 parameters per node-property row.</summary>
    internal const int GraphSnapshotNodePropertiesChunkSize = 250;

    public static List<(Guid RowId, GraphNode Node, int SortOrder)> PlanNodeRows(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<(Guid RowId, GraphNode Node, int SortOrder)> planned = [];

        for (int i = 0; i < snapshot.Nodes.Count; i++)
            planned.Add((Guid.NewGuid(), snapshot.Nodes[i], i));

        return planned;
    }

    public static async Task InsertNodeRowsAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        IReadOnlyList<(Guid RowId, GraphNode Node, int SortOrder)> planned,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(planned);

        if (planned.Count == 0)
            return;

        const string insertNodeSql = """
                                     INSERT INTO dbo.GraphSnapshotNodes
                                     (
                                         GraphNodeRowId, GraphSnapshotId, SortOrder,
                                         TenantId, WorkspaceId, ScopeProjectId,
                                         NodeId, NodeType, Label, Category, SourceType, SourceId
                                     )
                                     VALUES
                                     """;

        for (int offset = 0; offset < planned.Count; offset += GraphSnapshotNodesChunkSize)
        {
            int take = Math.Min(GraphSnapshotNodesChunkSize, planned.Count - offset);
            StringBuilder sql = new(insertNodeSql.Length + take * 80);
            sql.Append(insertNodeSql);

            DynamicParameters parameters = new();

            for (int i = 0; i < take; i++)
            {

                (Guid rowId, GraphNode node, int sortOrder) = planned[offset + i];



                if (i > 0)

                    sql.Append(',');



                string p = $"n{i}_";

                sql.Append('(')

                    .Append('@').Append(p).Append("rid,")

                    .Append('@').Append(p).Append("gsid,")

                    .Append('@').Append(p).Append("sort,")

                    .Append('@').Append(p).Append("tid,")

                    .Append('@').Append(p).Append("wid,")

                    .Append('@').Append(p).Append("pid,")

                    .Append('@').Append(p).Append("nid,")

                    .Append('@').Append(p).Append("nt,")

                    .Append('@').Append(p).Append("lab,")

                    .Append('@').Append(p).Append("cat,")

                    .Append('@').Append(p).Append("st,")

                    .Append('@').Append(p).Append("sid)");


                parameters.Add(p + "rid", rowId);
                parameters.Add(p + "gsid", snapshot.GraphSnapshotId);
                parameters.Add(p + "sort", sortOrder);
                parameters.Add(p + "tid", scope.TenantId);
                parameters.Add(p + "wid", scope.WorkspaceId);
                parameters.Add(p + "pid", scope.ProjectId);
                parameters.Add(p + "nid", node.NodeId);
                parameters.Add(p + "nt", node.NodeType);
                parameters.Add(p + "lab", node.Label);
                parameters.Add(p + "cat", node.Category);
                parameters.Add(p + "st", node.SourceType);
                parameters.Add(p + "sid", node.SourceId);
            }

            await connection.ExecuteAsync(
                new CommandDefinition(sql.ToString(), parameters, transaction, cancellationToken: ct));
        }
    }

    public static async Task InsertNodePropertyRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        IReadOnlyList<(Guid RowId, GraphNode Node, int SortOrder)> planned,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(planned);

        List<PropertyRow> flat = [];

        foreach ((Guid rowId, GraphNode node, _) in planned)
        {
            List<KeyValuePair<string, string>> orderedProps = node.Properties
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .ToList();

            for (int p = 0; p < orderedProps.Count; p++)
            {
                KeyValuePair<string, string> kv = orderedProps[p];
                flat.Add(new PropertyRow(rowId, p, kv.Key, kv.Value));
            }
        }

        if (flat.Count == 0)
            return;

        const string insertPropertyHeader = """
                                            INSERT INTO dbo.GraphSnapshotNodeProperties
                                            (GraphNodeRowId, PropertySortOrder, PropertyKey, PropertyValue, TenantId, WorkspaceId, ScopeProjectId)
                                            VALUES
                                            """;

        for (int offset = 0; offset < flat.Count; offset += GraphSnapshotNodePropertiesChunkSize)
        {
            int take = Math.Min(GraphSnapshotNodePropertiesChunkSize, flat.Count - offset);
            StringBuilder sql = new(insertPropertyHeader.Length + take * 64);
            sql.Append(insertPropertyHeader);

            DynamicParameters parameters = new();

            for (int i = 0; i < take; i++)
            {
                PropertyRow r = flat[offset + i];


                if (i > 0)

                    sql.Append(',');



                string p = $"np{i}_";

                sql.Append('(')

                    .Append('@').Append(p).Append("rid,")

                    .Append('@').Append(p).Append("ord,")

                    .Append('@').Append(p).Append("pk,")

                    .Append('@').Append(p).Append("pv,")

                    .Append('@').Append(p).Append("tid,")

                    .Append('@').Append(p).Append("wid,")

                    .Append('@').Append(p).Append("pid)");


                parameters.Add(p + "rid", r.GraphNodeRowId);
                parameters.Add(p + "ord", r.PropertySortOrder);
                parameters.Add(p + "pk", r.PropertyKey);
                parameters.Add(p + "pv", r.PropertyValue);
                parameters.Add(p + "tid", scope.TenantId);
                parameters.Add(p + "wid", scope.WorkspaceId);
                parameters.Add(p + "pid", scope.ProjectId);
            }

            await connection.ExecuteAsync(
                new CommandDefinition(sql.ToString(), parameters, transaction, cancellationToken: ct));
        }
    }

    public static async Task InsertEdgePropertyRowsAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        List<EdgePropertyRow> rows = [];

        foreach (GraphEdge edge in snapshot.Edges)
        {
            int sort = 0;

            if (!string.IsNullOrEmpty(edge.Label))

                rows.Add(
                    new EdgePropertyRow(
                        snapshot.GraphSnapshotId,
                        edge.EdgeId,
                        sort++,
                        GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
                        edge.Label));


            List<KeyValuePair<string, string>> orderedProps = edge.Properties
                .Where(kv => !string.Equals(kv.Key, GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
                    StringComparison.Ordinal))
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .ToList();

            foreach (KeyValuePair<string, string> kv in orderedProps)

                rows.Add(new EdgePropertyRow(snapshot.GraphSnapshotId, edge.EdgeId, sort++, kv.Key, kv.Value));
        }

        if (rows.Count == 0)
            return;

        const string insertEdgePropHeader = """
                                            INSERT INTO dbo.GraphSnapshotEdgeProperties
                                            (
                                                GraphSnapshotId, EdgeId, PropertySortOrder, PropertyKey, PropertyValue,
                                                TenantId, WorkspaceId, ScopeProjectId)
                                            VALUES
                                            """;

        for (int offset = 0; offset < rows.Count; offset += GraphSnapshotEdgePropertiesChunkSize)
        {
            int take = Math.Min(GraphSnapshotEdgePropertiesChunkSize, rows.Count - offset);
            StringBuilder sql = new(insertEdgePropHeader.Length + take * 72);
            sql.Append(insertEdgePropHeader);

            DynamicParameters parameters = new();

            for (int i = 0; i < take; i++)
            {
                EdgePropertyRow r = rows[offset + i];


                if (i > 0)

                    sql.Append(',');



                string p = $"ep{i}_";

                sql.Append('(')

                    .Append('@').Append(p).Append("gsid,")

                    .Append('@').Append(p).Append("eid,")

                    .Append('@').Append(p).Append("ord,")

                    .Append('@').Append(p).Append("pk,")

                    .Append('@').Append(p).Append("pv,")

                    .Append('@').Append(p).Append("tid,")

                    .Append('@').Append(p).Append("wid,")

                    .Append('@').Append(p).Append("pid)");


                parameters.Add(p + "gsid", r.GraphSnapshotId);
                parameters.Add(p + "eid", r.EdgeId);
                parameters.Add(p + "ord", r.PropertySortOrder);
                parameters.Add(p + "pk", r.PropertyKey);
                parameters.Add(p + "pv", r.PropertyValue);
                parameters.Add(p + "tid", scope.TenantId);
                parameters.Add(p + "wid", scope.WorkspaceId);
                parameters.Add(p + "pid", scope.ProjectId);
            }

            await connection.ExecuteAsync(
                new CommandDefinition(sql.ToString(), parameters, transaction, cancellationToken: ct));
        }
    }

    private readonly record struct PropertyRow(
        Guid GraphNodeRowId,
        int PropertySortOrder,
        string PropertyKey,
        string PropertyValue);

    private readonly record struct EdgePropertyRow(
        Guid GraphSnapshotId,
        string EdgeId,
        int PropertySortOrder,
        string PropertyKey,
        string PropertyValue);
}
