using System.Data;

using ArchLucid.Persistence.Repositories;

using Dapper;

namespace ArchLucid.Persistence.GraphSnapshots;

internal static partial class GraphSnapshotRelationalRead
{
    private static async Task<List<GraphNode>> LoadNodesRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid graphSnapshotId,
        CancellationToken ct)
    {
        const string nodesSql = """
                                SELECT GraphNodeRowId, SortOrder, NodeId, NodeType, Label, Category, SourceType, SourceId
                                FROM dbo.GraphSnapshotNodes
                                WHERE GraphSnapshotId = @GraphSnapshotId
                                ORDER BY SortOrder;
                                """;

        List<GraphNodeRow> nodeRows = (await connection.QueryAsync<GraphNodeRow>(
            new CommandDefinition(
                nodesSql,
                new { GraphSnapshotId = graphSnapshotId },
                transaction,
                cancellationToken: ct))).ToList();

        if (nodeRows.Count == 0)
            return [];

        const string propsSql = """
                                SELECT p.GraphNodeRowId, p.PropertySortOrder, p.PropertyKey, p.PropertyValue
                                FROM dbo.GraphSnapshotNodeProperties AS p
                                WHERE EXISTS (
                                    SELECT 1
                                    FROM dbo.GraphSnapshotNodes AS n
                                    WHERE n.GraphNodeRowId = p.GraphNodeRowId
                                      AND n.GraphSnapshotId = @GraphSnapshotId)
                                ORDER BY p.GraphNodeRowId, p.PropertySortOrder;
                                """;

        List<NodePropertyRow> propertyRows = (await connection.QueryAsync<NodePropertyRow>(
            new CommandDefinition(
                propsSql,
                new { GraphSnapshotId = graphSnapshotId },
                transaction,
                cancellationToken: ct))).ToList();

        Dictionary<Guid, Dictionary<string, string>> propsByNode = new();
        foreach (NodePropertyRow pr in propertyRows)
        {
            if (!propsByNode.TryGetValue(pr.GraphNodeRowId, out Dictionary<string, string>? dict))
            {
                dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                propsByNode[pr.GraphNodeRowId] = dict;
            }

            dict[pr.PropertyKey] = pr.PropertyValue;
        }

        List<GraphNode> result = [];
        foreach (GraphNodeRow r in nodeRows)
        {
            propsByNode.TryGetValue(r.GraphNodeRowId, out Dictionary<string, string>? props);
            props ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            result.Add(
                new GraphNode
                {
                    NodeId = r.NodeId,
                    NodeType = r.NodeType,
                    Label = r.Label,
                    Category = r.Category,
                    SourceType = r.SourceType,
                    SourceId = r.SourceId,
                    Properties = props
                });
        }

        return result;
    }

    private sealed class GraphNodeRow
    {
        public Guid GraphNodeRowId
        {
            get;
            init;
        }

        public int SortOrder
        {
            get;
            init;
        }

        public string NodeId
        {
            get;
            init;
        } = null!;

        public string NodeType
        {
            get;
            init;
        } = null!;

        public string Label
        {
            get;
            init;
        } = null!;

        public string? Category
        {
            get;
            init;
        }

        public string? SourceType
        {
            get;
            init;
        }

        public string? SourceId
        {
            get;
            init;
        }
    }

    private sealed class NodePropertyRow
    {
        public Guid GraphNodeRowId
        {
            get;
            init;
        }

        public int PropertySortOrder
        {
            get;
            init;
        }

        public string PropertyKey
        {
            get;
            init;
        } = null!;

        public string PropertyValue
        {
            get;
            init;
        } = null!;
    }
}
