using System.Data;

using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;

using Dapper;

namespace ArchLucid.Persistence.GraphSnapshots;

internal static partial class GraphSnapshotRelationalRead
{
    private static async Task<List<GraphEdge>> LoadEdgesRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid graphSnapshotId,
        GraphSnapshotStorageRow? jsonRowForMerge,
        CancellationToken ct)
    {
        const string edgesSql = """
                                SELECT EdgeId, FromNodeId, ToNodeId, EdgeType, Weight
                                FROM dbo.GraphSnapshotEdges
                                WHERE GraphSnapshotId = @GraphSnapshotId
                                ORDER BY EdgeId;
                                """;

        List<GraphEdgeTableRow> edgeRows = (await connection.QueryAsync<GraphEdgeTableRow>(
            new CommandDefinition(
                edgesSql,
                new { GraphSnapshotId = graphSnapshotId },
                transaction,
                cancellationToken: ct))).ToList();

        if (edgeRows.Count == 0)
            return [];

        List<EdgePropertyRow> propertyRows = (await connection.QueryAsync<EdgePropertyRow>(
            new CommandDefinition(
                """
                SELECT EdgeId, PropertySortOrder, PropertyKey, PropertyValue
                FROM dbo.GraphSnapshotEdgeProperties
                WHERE GraphSnapshotId = @GraphSnapshotId
                ORDER BY EdgeId, PropertySortOrder;
                """,
                new { GraphSnapshotId = graphSnapshotId },
                transaction,
                cancellationToken: ct))).ToList();

        Dictionary<string, List<EdgePropertyRow>> propsByEdge = new(StringComparer.Ordinal);
        foreach (EdgePropertyRow pr in propertyRows)
        {
            if (!propsByEdge.TryGetValue(pr.EdgeId, out List<EdgePropertyRow>? list))
            {
                list = [];
                propsByEdge[pr.EdgeId] = list;
            }

            list.Add(pr);
        }

        string edgesJson;

        if (jsonRowForMerge is not null && !string.IsNullOrWhiteSpace(jsonRowForMerge.EdgesJson))
            edgesJson = jsonRowForMerge.EdgesJson;
        else
        {
            const string edgesJsonSql =
                "SELECT EdgesJson FROM dbo.GraphSnapshots WHERE GraphSnapshotId = @GraphSnapshotId";

            string? loaded = await connection.QuerySingleOrDefaultAsync<string>(
                new CommandDefinition(
                    edgesJsonSql,
                    new { GraphSnapshotId = graphSnapshotId },
                    transaction,
                    cancellationToken: ct));

            edgesJson = string.IsNullOrWhiteSpace(loaded) ? "[]" : loaded;
        }

        List<GraphEdge> jsonEdges = JsonEntitySerializer.Deserialize<List<GraphEdge>>(edgesJson);
        Dictionary<string, GraphEdge> jsonById = jsonEdges.ToDictionary(e => e.EdgeId, StringComparer.Ordinal);

        List<GraphEdge> result = [];
        foreach (GraphEdgeTableRow er in edgeRows)
        {
            string? label = null;
            Dictionary<string, string> props = new(StringComparer.OrdinalIgnoreCase);

            if (propsByEdge.TryGetValue(er.EdgeId, out List<EdgePropertyRow>? rowsForEdge))

                foreach (EdgePropertyRow pr in rowsForEdge.OrderBy(x => x.PropertySortOrder))

                    if (string.Equals(pr.PropertyKey, GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
                            StringComparison.Ordinal))
                        label = pr.PropertyValue;
                    else
                        props[pr.PropertyKey] = pr.PropertyValue;

            GraphEdge edge = new()
            {
                EdgeId = er.EdgeId,
                FromNodeId = er.FromNodeId,
                ToNodeId = er.ToNodeId,
                EdgeType = er.EdgeType,
                Weight = er.Weight,
                Label = label,
                Properties = props
            };

            if (jsonById.TryGetValue(er.EdgeId, out GraphEdge? fromJson))
            {
                if (string.IsNullOrEmpty(edge.Label) && !string.IsNullOrEmpty(fromJson.Label))
                    edge.Label = fromJson.Label;

                if (string.IsNullOrWhiteSpace(edge.InferenceSource)
                    && !string.IsNullOrWhiteSpace(fromJson.InferenceSource))
                    edge.InferenceSource = fromJson.InferenceSource;

                if (string.IsNullOrWhiteSpace(edge.ReasoningTrace)
                    && !string.IsNullOrWhiteSpace(fromJson.ReasoningTrace))
                    edge.ReasoningTrace = fromJson.ReasoningTrace;

                if (edge.Properties.Count == 0 && fromJson.Properties.Count > 0)
                    edge.Properties = new Dictionary<string, string>(fromJson.Properties, StringComparer.OrdinalIgnoreCase);
            }

            result.Add(edge);
        }

        return result;
    }

    private sealed class GraphEdgeTableRow
    {
        public string EdgeId
        {
            get;
            init;
        } = null!;

        public string FromNodeId
        {
            get;
            init;
        } = null!;

        public string ToNodeId
        {
            get;
            init;
        } = null!;

        public string EdgeType
        {
            get;
            init;
        } = null!;

        public double Weight
        {
            get;
            init;
        }
    }

    private sealed class EdgePropertyRow
    {
        public string EdgeId
        {
            get;
            init;
        } = null!;

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
