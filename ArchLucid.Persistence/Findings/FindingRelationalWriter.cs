using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Writes a <see cref="FindingsSnapshot" /> into the relational finding tables. Ordering matters: each finding gets a
///     stable <c>SortOrder</c> from its snapshot position, and child rows are inserted after the parent record so foreign
///     keys hold inside the caller's transaction.
/// </summary>
internal static class FindingRelationalWriter
{
    public static async Task InsertSnapshotFindingsAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(scope);

        for (int sortOrder = 0; sortOrder < snapshot.Findings.Count; sortOrder++)
        {
            Finding finding = snapshot.Findings[sortOrder];
            Guid recordId = Guid.NewGuid();

            await InsertFindingRecordAsync(
                connection,
                transaction,
                snapshot.FindingsSnapshotId,
                recordId,
                sortOrder,
                finding,
                scope,
                ct);

            await InsertFindingChildrenAsync(connection, transaction, recordId, finding, scope, ct);
        }
    }

    private static async Task InsertFindingRecordAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingsSnapshotId,
        Guid findingRecordId,
        int sortOrder,
        Finding finding,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        object args = new
        {
            FindingRecordId = findingRecordId,
            FindingsSnapshotId = findingsSnapshotId,
            SortOrder = sortOrder,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            finding.FindingId,
            finding.FindingSchemaVersion,
            finding.FindingType,
            finding.Category,
            finding.QualityDimension,
            finding.EngineType,
            Severity = finding.Severity.ToString(),
            finding.Title,
            finding.Rationale,
            finding.PayloadType,
            PayloadJson = FindingPayloadJsonCodec.SerializePayload(finding.Payload),
            finding.RequestInputRef,
            finding.RunIdRef,
            AgentExecutionTraceId = finding.AgentExecutionTraceId ?? finding.Trace.SourceAgentExecutionTraceId,
            finding.ModelDeploymentName,
            finding.ModelVersion,
            finding.PromptTemplateId,
            finding.PromptTemplateVersion,
            finding.ConfidenceScore,
            finding.EvaluationConfidenceScore,
            EvaluationConfidenceLevel = finding.ConfidenceLevel is { } lvl ? lvl.ToString() : null,
            finding.PolicyRuleId,
            HumanReviewStatus = finding.HumanReviewStatus.ToString(),
            finding.ReviewedByUserId,
            finding.ReviewedAtUtc,
            finding.ReviewNotes,
            finding.IsMuted,
            finding.MuteReason,
            ReasoningTrace = finding.Trace.ReasoningTrace,
            ReasoningTraceDigestSha256 = finding.Trace.ReasoningTraceDigestSha256,
            finding.InsightDensityScore,
            Treatment = FindingInsightDensityColumnCodec.ToTreatmentStorage(finding.Treatment),
            Classification = FindingInsightDensityColumnCodec.ToClassificationStorage(finding.Classification),
            finding.WhyThisIsNotGeneric,
            finding.PrincipalArchitectValue,
            finding.DecisionConsequence
        };

        await connection.ExecuteAsync(
            new CommandDefinition(
                FindingsSnapshotWriteSql.InsertFindingRecord,
                args,
                transaction,
                cancellationToken: ct));
    }

    private static async Task InsertFindingChildrenAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Finding finding,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        await InsertNodeIdRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.RelatedNodesInsert,
            finding.RelatedNodeIds,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.RecommendedActionsInsert,
            finding.RecommendedActions,
            ct);

        await InsertPropertyRowsAsync(connection, transaction, findingRecordId, scope, finding.Properties, ct);

        await InsertNodeIdRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceGraphNodesExaminedInsert,
            finding.Trace.GraphNodeIdsExamined,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceRulesAppliedInsert,
            finding.Trace.RulesApplied,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceDecisionsTakenInsert,
            finding.Trace.DecisionsTaken,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceAlternativePathsInsert,
            finding.Trace.AlternativePathsConsidered,
            ct);

        await InsertTextRowsAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.TraceNotesInsert,
            finding.Trace.Notes,
            ct);
    }

    private static async Task InsertNodeIdRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        IReadOnlyList<string> nodeIds,
        CancellationToken ct)
    {
        if (nodeIds.Count == 0)
            return;

        DataTable rows = FindingChildTableValuedParameters.CreateSortNodeIdTable(nodeIds);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            sql,
            rows,
            FindingChildTableValuedParameters.SortNodeIdListTypeName,
            ct);
    }

    private static async Task InsertTextRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        IReadOnlyList<string> textRows,
        CancellationToken ct)
    {
        if (textRows.Count == 0)
            return;

        DataTable rows = FindingChildTableValuedParameters.CreateSortTextTable(textRows);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            sql,
            rows,
            FindingChildTableValuedParameters.SortTextListTypeName,
            ct);
    }

    private static async Task InsertPropertyRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        IReadOnlyDictionary<string, string> properties,
        CancellationToken ct)
    {
        if (properties.Count == 0)
            return;

        // Ordinal key ordering keeps property row order deterministic across saves and re-reads.
        List<KeyValuePair<string, string>> orderedProps = properties
            .OrderBy(static kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        DataTable rows = FindingChildTableValuedParameters.CreatePropertyTable(orderedProps);

        await ExecuteChildInsertAsync(
            connection,
            transaction,
            findingRecordId,
            scope,
            FindingChildInsertQueryShapes.PropertiesInsert,
            rows,
            FindingChildTableValuedParameters.PropertyListTypeName,
            ct);
    }

    private static async Task ExecuteChildInsertAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        FindingRelationalScope scope,
        string sql,
        DataTable rows,
        string tableTypeName,
        CancellationToken ct)
    {
        DynamicParameters parameters = FindingChildTableValuedParameters.CreateScopeParameters(
            findingRecordId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            rows,
            tableTypeName);

        await connection.ExecuteAsync(new CommandDefinition(sql, parameters, transaction, cancellationToken: ct));
    }
}
