using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

internal static class FindingsSnapshotChildRelationalSlices
{
    internal sealed record ChildRelationalSlices(
        Dictionary<Guid, List<string>> RelatedNodes,
        Dictionary<Guid, List<string>> RecommendedActions,
        Dictionary<Guid, Dictionary<string, string>> Properties,
        Dictionary<Guid, List<string>> TraceGraphNodesExamined,
        Dictionary<Guid, List<string>> TraceRulesApplied,
        Dictionary<Guid, List<string>> TraceDecisionsTaken,
        Dictionary<Guid, List<string>> TraceAlternativePaths,
        Dictionary<Guid, List<string>> TraceNotes);

    internal static async Task<ChildRelationalSlices> LoadChildRelationalSlicesAsync(
        SqlConnection connection,
        List<Guid> recordIds,
        CancellationToken ct)
    {
        if (recordIds.Count == 0)
            return new ChildRelationalSlices(
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, Dictionary<string, string>>(),
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, List<string>>(),
                new Dictionary<Guid, List<string>>());

        const string sql = """
                           SELECT SliceKind, FindingRecordId, SortOrder, Item, PropertyKey, PropertyValue
                           FROM (
                               SELECT CAST(N'RelatedNodes' AS NVARCHAR(32)) AS SliceKind,
                                      FindingRecordId, SortOrder,
                                      CAST(NodeId AS NVARCHAR(MAX)) AS Item,
                                      CAST(NULL AS NVARCHAR(200)) AS PropertyKey,
                                      CAST(NULL AS NVARCHAR(MAX)) AS PropertyValue
                               FROM dbo.FindingRelatedNodes
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'RecommendedActions' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(ActionText AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingRecommendedActions
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'Properties' AS NVARCHAR(32)),
                                      FindingRecordId, PropertySortOrder,
                                      CAST(NULL AS NVARCHAR(MAX)),
                                      PropertyKey,
                                      PropertyValue
                               FROM dbo.FindingProperties
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'TraceGraphNodes' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(NodeId AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingTraceGraphNodesExamined
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'TraceRules' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(RuleText AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingTraceRulesApplied
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'TraceDecisions' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(DecisionText AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingTraceDecisionsTaken
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'TracePaths' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(PathText AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingTraceAlternativePaths
                               WHERE FindingRecordId IN @Ids
                               UNION ALL
                               SELECT CAST(N'TraceNotes' AS NVARCHAR(32)),
                                      FindingRecordId, SortOrder,
                                      CAST(NoteText AS NVARCHAR(MAX)),
                                      CAST(NULL AS NVARCHAR(200)),
                                      CAST(NULL AS NVARCHAR(MAX))
                               FROM dbo.FindingTraceNotes
                               WHERE FindingRecordId IN @Ids
                           ) AS slices
                           ORDER BY SliceKind, FindingRecordId, SortOrder;
                           """;

        // Unbuffered: fold rows as they arrive so fat child pages do not materialize a second List.
        IEnumerable<FindingChildSliceRow> rows = await connection.QueryAsync<FindingChildSliceRow>(
            new CommandDefinition(
                sql,
                new { Ids = recordIds },
                flags: CommandFlags.None,
                cancellationToken: ct));

        return FoldChildRelationalSlices(rows);
    }

    private static ChildRelationalSlices FoldChildRelationalSlices(IEnumerable<FindingChildSliceRow> rows)
    {
        Dictionary<Guid, List<string>> related = new();
        Dictionary<Guid, List<string>> actions = new();
        Dictionary<Guid, Dictionary<string, string>> props = new();
        Dictionary<Guid, List<string>> traceNodes = new();
        Dictionary<Guid, List<string>> traceRules = new();
        Dictionary<Guid, List<string>> traceDecisions = new();
        Dictionary<Guid, List<string>> tracePaths = new();
        Dictionary<Guid, List<string>> traceNotes = new();

        foreach (FindingChildSliceRow row in rows)
        {
            if (string.Equals(row.SliceKind, FindingChildSliceKind.RelatedNodes, StringComparison.Ordinal))
                AppendChildString(related, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.RecommendedActions, StringComparison.Ordinal))
                AppendChildString(actions, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.Properties, StringComparison.Ordinal))
                AppendChildProperty(props, row.FindingRecordId, row.PropertyKey, row.PropertyValue);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.TraceGraphNodes, StringComparison.Ordinal))
                AppendChildString(traceNodes, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.TraceRules, StringComparison.Ordinal))
                AppendChildString(traceRules, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.TraceDecisions, StringComparison.Ordinal))
                AppendChildString(traceDecisions, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.TracePaths, StringComparison.Ordinal))
                AppendChildString(tracePaths, row.FindingRecordId, row.Item);
            else if (string.Equals(row.SliceKind, FindingChildSliceKind.TraceNotes, StringComparison.Ordinal))
                AppendChildString(traceNotes, row.FindingRecordId, row.Item);
            else
                throw new InvalidOperationException(
                    "Unknown Finding child slice kind '" + row.SliceKind + "' from relational read.");
        }

        return new ChildRelationalSlices(
            related,
            actions,
            props,
            traceNodes,
            traceRules,
            traceDecisions,
            tracePaths,
            traceNotes);
    }

    private static void AppendChildString(Dictionary<Guid, List<string>> target, Guid recordId, string? item)
    {
        if (item is null)
            return;

        if (!target.TryGetValue(recordId, out List<string>? list))
        {
            list = [];
            target[recordId] = list;
        }

        list.Add(item);
    }

    private static void AppendChildProperty(
        Dictionary<Guid, Dictionary<string, string>> target,
        Guid recordId,
        string? propertyKey,
        string? propertyValue)
    {
        if (string.IsNullOrEmpty(propertyKey) || propertyValue is null)
            return;

        if (!target.TryGetValue(recordId, out Dictionary<string, string>? dict))
        {
            dict = new Dictionary<string, string>(StringComparer.Ordinal);
            target[recordId] = dict;
        }

        dict[propertyKey] = propertyValue;
    }

    private static class FindingChildSliceKind
    {
        internal const string RelatedNodes = "RelatedNodes";

        internal const string RecommendedActions = "RecommendedActions";

        internal const string Properties = "Properties";

        internal const string TraceGraphNodes = "TraceGraphNodes";

        internal const string TraceRules = "TraceRules";

        internal const string TraceDecisions = "TraceDecisions";

        internal const string TracePaths = "TracePaths";

        internal const string TraceNotes = "TraceNotes";
    }
}
