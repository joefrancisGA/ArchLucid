using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

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
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        bool hasInsightDensityColumns =
            await FindingRecordsSchemaCapabilities.HasInsightDensityColumnsAsync(connection, ct);

        string recordsSql = FindingsSnapshotSqlBuilder.BuildFindingRecordsSelectSql(scope, hasInsightDensityColumns);

        DynamicParameters parameters = new();
        parameters.Add("FindingsSnapshotId", row.FindingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        List<FindingRecordRow> records = (await connection.QueryAsync<FindingRecordRow>(
            new CommandDefinition(
                recordsSql,
                parameters,
                cancellationToken: ct))).ToList();

        if (records.Count == 0)
        {
            List<Finding> legacyFindings = FindingsSnapshotLegacyJsonReader.DeserializeFindings(row.FindingsJson);

            return ApplyChecklistHeaderFields(new FindingsSnapshot
            {
                FindingsSnapshotId = row.FindingsSnapshotId,
                RunId = row.RunId,
                ContextSnapshotId = row.ContextSnapshotId,
                GraphSnapshotId = row.GraphSnapshotId,
                CreatedUtc = row.CreatedUtc,
                SchemaVersion = row.SchemaVersion,
                GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
                Findings = legacyFindings
            }, row);
        }

        List<Guid> recordIds = records.Select(r => r.FindingRecordId).ToList();

        FindingsSnapshotChildRelationalSlices.ChildRelationalSlices slices =
            await FindingsSnapshotChildRelationalSlices.LoadChildRelationalSlicesAsync(connection, recordIds, ct);

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
                QualityDimension = rec.QualityDimension,
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
                IsMuted = rec.IsMuted,
                MuteReason = rec.MuteReason,
                InsightDensityScore = rec.InsightDensityScore,
                Treatment = FindingInsightDensityColumnCodec.FromTreatmentStorage(rec.Treatment),
                Classification = FindingInsightDensityColumnCodec.FromClassificationStorage(rec.Classification),
                WhyThisIsNotGeneric = rec.WhyThisIsNotGeneric,
                PrincipalArchitectValue = rec.PrincipalArchitectValue,
                DecisionConsequence = rec.DecisionConsequence,
                Trace = new ExplainabilityTrace
                {
                    SourceAgentExecutionTraceId = rec.AgentExecutionTraceId,
                    GraphNodeIdsExamined = traceNodesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    RulesApplied = traceRulesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    DecisionsTaken = traceDecisionsByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    AlternativePathsConsidered =
                        tracePathsByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    Notes = traceNotesByRecord.GetValueOrDefault(rec.FindingRecordId) ?? [],
                    ReasoningTrace = rec.ReasoningTrace,
                    ReasoningTraceDigestSha256 = rec.ReasoningTraceDigestSha256,
                }
            };

            findings.Add(finding);
        }

        if (!hasInsightDensityColumns)
            FindingInsightDensityJsonMerger.MergeFromFindingsJson(findings, row.FindingsJson);

        return ApplyChecklistHeaderFields(new FindingsSnapshot
        {
            FindingsSnapshotId = row.FindingsSnapshotId,
            RunId = row.RunId,
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            CreatedUtc = row.CreatedUtc,
            SchemaVersion = row.SchemaVersion,
            GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
            Findings = findings
        }, row);
    }

    private static FindingsSnapshot ApplyChecklistHeaderFields(FindingsSnapshot snapshot, FindingsSnapshotStorageRow row)
    {
        snapshot.ChecklistCoverage = ChecklistCoverageJsonCodec.Deserialize(row.ChecklistCoverageJson);

        if (row.InsightDensityDemotedCount.HasValue || row.InsightDensityRetainedCount.HasValue)
        {
            snapshot.InsightDensityCuration = new InsightDensityCurationSummary
            {
                DemotedToChecklistCount = row.InsightDensityDemotedCount ?? snapshot.ChecklistCoverage.Count,
                RetainedFindingCount = row.InsightDensityRetainedCount ?? snapshot.Findings.Count,
            };
        }

        return snapshot;
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
}
