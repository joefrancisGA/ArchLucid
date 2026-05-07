using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Models;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Builds <see cref="FindingsSnapshot" /> from relational finding tables when rows exist; otherwise
///     <c>FindingsJson</c>.
/// </summary>
internal static class FindingsSnapshotRelationalRead
{
    internal static async Task<FindingsSnapshot> LoadRelationalSnapshotAsync(
        SqlConnection connection,
        FindingsSnapshotStorageRow row,
        CancellationToken ct)
    {
        const string recordsSql = """
                                  SELECT
                                      FindingRecordId, SortOrder, FindingId, FindingSchemaVersion, FindingType, Category, EngineType,
                                      Severity, Title, Rationale, PayloadType, PayloadJson,
                                      RequestInputRef, RunIdRef, AgentExecutionTraceId,
                                      ModelDeploymentName, ModelVersion, PromptTemplateId, PromptTemplateVersion,
                                      ConfidenceScore, EvaluationConfidenceScore, EvaluationConfidenceLevel, PolicyRuleId,
                                      HumanReviewStatus, ReviewedByUserId, ReviewedAtUtc, ReviewNotes
                                  FROM dbo.FindingRecords
                                  WHERE FindingsSnapshotId = @FindingsSnapshotId
                                  ORDER BY SortOrder;
                                  """;

        List<FindingRecordRow> records = (await connection.QueryAsync<FindingRecordRow>(
            new CommandDefinition(
                recordsSql,
                new { row.FindingsSnapshotId },
                cancellationToken: ct))).ToList();

        if (records.Count == 0)
        {
            List<Finding> legacyFindings = FindingsSnapshotLegacyJsonReader.DeserializeFindings(row.FindingsJson);

            return new FindingsSnapshot
            {
                FindingsSnapshotId = row.FindingsSnapshotId,
                RunId = row.RunId,
                ContextSnapshotId = row.ContextSnapshotId,
                GraphSnapshotId = row.GraphSnapshotId,
                CreatedUtc = row.CreatedUtc,
                SchemaVersion = row.SchemaVersion,
                GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
                Findings = legacyFindings
            };
        }

        List<Guid> recordIds = records.Select(r => r.FindingRecordId).ToList();

        ChildRelationalSlices slices = await LoadChildRelationalSlicesAsync(connection, recordIds, ct);

        Dictionary<Guid, List<string>> relatedByRecord = slices.RelatedNodes;

        Dictionary<Guid, List<string>> actionsByRecord = slices.RecommendedActions;

        Dictionary<Guid, Dictionary<string, string>> propsByRecord = slices.Properties;

        Dictionary<Guid, List<string>> traceNodesByRecord = slices.TraceGraphNodesExamined;

        Dictionary<Guid, List<string>> traceRulesByRecord = slices.TraceRulesApplied;

        Dictionary<Guid, List<string>> traceDecisionsByRecord = slices.TraceDecisionsTaken;

        Dictionary<Guid, List<string>> tracePathsByRecord = slices.TraceAlternativePaths;

        Dictionary<Guid, List<string>> traceNotesByRecord = slices.TraceNotes;
        List<Finding> findings = [];
        foreach (FindingRecordRow rec in records)
        {
            Finding finding = new()
            {
                FindingId = rec.FindingId,
                FindingSchemaVersion = rec.FindingSchemaVersion,
                FindingType = rec.FindingType,
                Category = rec.Category,
                EngineType = rec.EngineType,
                Severity = Enum.Parse<FindingSeverity>(rec.Severity, true),
                Title = rec.Title,
                Rationale = rec.Rationale,
                PayloadType = rec.PayloadType,
                Payload = FindingPayloadJsonCodec.DeserializePayload(rec.PayloadJson, rec.PayloadType),
                RelatedNodeIds = relatedByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                RecommendedActions = actionsByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                Properties =
                    propsByRecord.GetValueOrDefault(rec.FindingRecordId) ??
                    new Dictionary<string, string>(StringComparer.Ordinal),
                RequestInputRef = rec.RequestInputRef,
                RunIdRef = rec.RunIdRef,
                AgentExecutionTraceId = rec.AgentExecutionTraceId,
                ModelDeploymentName = rec.ModelDeploymentName,
                ModelVersion = rec.ModelVersion,
                PromptTemplateId = rec.PromptTemplateId,
                PromptTemplateVersion = rec.PromptTemplateVersion,
                ConfidenceScore = rec.ConfidenceScore,
                EvaluationConfidenceScore = rec.EvaluationConfidenceScore,
                ConfidenceLevel = ParseEvaluationConfidenceLevel(rec.EvaluationConfidenceLevel),
                PolicyRuleId = rec.PolicyRuleId,
                HumanReviewStatus = ParseHumanReviewStatus(rec.HumanReviewStatus),
                ReviewedByUserId = rec.ReviewedByUserId,
                ReviewedAtUtc = rec.ReviewedAtUtc is { } ra ? new DateTimeOffset(DateTime.SpecifyKind(ra, DateTimeKind.Utc)) : null,
                ReviewNotes = rec.ReviewNotes,
                Trace = new ExplainabilityTrace
                {
                    SourceAgentExecutionTraceId = rec.AgentExecutionTraceId,
                    GraphNodeIdsExamined = traceNodesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    RulesApplied = traceRulesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    DecisionsTaken = traceDecisionsByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    AlternativePathsConsidered =
                        tracePathsByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    Notes = traceNotesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? []
                }
            };

            findings.Add(finding);
        }

        return new FindingsSnapshot
        {
            FindingsSnapshotId = row.FindingsSnapshotId,
            RunId = row.RunId,
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            CreatedUtc = row.CreatedUtc,
            SchemaVersion = row.SchemaVersion,
            GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
            Findings = findings
        };
    }

    private static FindingConfidenceLevel? ParseEvaluationConfidenceLevel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingConfidenceLevel lvl) ? lvl : null;
    }

    private static FindingHumanReviewStatus ParseHumanReviewStatus(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw) && Enum.TryParse(raw.Trim(), true, out FindingHumanReviewStatus st))
            return st;

        return FindingHumanReviewStatus.NotRequired;
    }


    private sealed record ChildRelationalSlices(
        Dictionary<Guid, List<string>> RelatedNodes,
        Dictionary<Guid, List<string>> RecommendedActions,
        Dictionary<Guid, Dictionary<string, string>> Properties,
        Dictionary<Guid, List<string>> TraceGraphNodesExamined,
        Dictionary<Guid, List<string>> TraceRulesApplied,
        Dictionary<Guid, List<string>> TraceDecisionsTaken,
        Dictionary<Guid, List<string>> TraceAlternativePaths,
        Dictionary<Guid, List<string>> TraceNotes);

    private static async Task<ChildRelationalSlices> LoadChildRelationalSlicesAsync(
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

        List<FindingChildSliceRow> rows = (await connection.QueryAsync<FindingChildSliceRow>(
            new CommandDefinition(
                sql,
                new { Ids = recordIds },
                cancellationToken: ct))).ToList();

        return FoldChildRelationalSlices(rows);
    }

    private static ChildRelationalSlices FoldChildRelationalSlices(IReadOnlyList<FindingChildSliceRow> rows)
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

    private sealed class FindingRecordRow
    {
        public Guid FindingRecordId
        {
            get;
            init;
        }

        public int SortOrder
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = null!;

        public int FindingSchemaVersion
        {
            get;
            init;
        }

        public string FindingType
        {
            get;
            init;
        } = null!;

        public string Category
        {
            get;
            init;
        } = null!;

        public string EngineType
        {
            get;
            init;
        } = null!;

        public string Severity
        {
            get;
            init;
        } = null!;

        public string Title
        {
            get;
            init;
        } = null!;

        public string Rationale
        {
            get;
            init;
        } = null!;

        public string? PayloadType
        {
            get;
            init;
        }

        public string? PayloadJson
        {
            get;
            init;
        }

        public string? RequestInputRef
        {
            get;
            init;
        }

        public string? RunIdRef
        {
            get;
            init;
        }

        public string? AgentExecutionTraceId
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }

        public string? ModelVersion
        {
            get;
            init;
        }

        public string? PromptTemplateId
        {
            get;
            init;
        }

        public string? PromptTemplateVersion
        {
            get;
            init;
        }

        public double? ConfidenceScore
        {
            get;
            init;
        }

        public int? EvaluationConfidenceScore
        {
            get;
            init;
        }

        public string? EvaluationConfidenceLevel
        {
            get;
            init;
        }

        public string? PolicyRuleId
        {
            get;
            init;
        }

        public string? HumanReviewStatus
        {
            get;
            init;
        }

        public string? ReviewedByUserId
        {
            get;
            init;
        }

        public DateTime? ReviewedAtUtc
        {
            get;
            init;
        }

        public string? ReviewNotes
        {
            get;
            init;
        }
    }

#pragma warning disable CA1812 // instantiated via Dapper
    private sealed class FindingChildSliceRow
#pragma warning restore CA1812
    {
        public string SliceKind
        {
            get;
            init;
        } = null!;

        public Guid FindingRecordId
        {
            get;
            init;
        }

        public int SortOrder
        {
            get;
            init;
        }

        public string? Item
        {
            get;
            init;
        }

        public string? PropertyKey
        {
            get;
            init;
        }

        public string? PropertyValue
        {
            get;
            init;
        }
    }
}
