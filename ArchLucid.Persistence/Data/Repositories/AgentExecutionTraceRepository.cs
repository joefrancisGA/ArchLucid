using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper-backed persistence for <see cref="AgentExecutionTrace" /> entities.
///     <see cref="CreateAsync" /> delete-then-insert upserts on (RunId, TaskId, AgentType, AttemptIndex) — TB-044;
///     attempt 0 re-execute clears later attempt rows (TB-035).
///     Read paths use <see cref="IReadOnlyDbConnectionFactory" /> (read replica when configured).
/// </summary>
/// <remarks>
///     Statements live in <see cref="AgentExecutionTraceSql" /> and <see cref="AgentExecutionTraceQueryShapes" />,
///     parameters in <see cref="AgentExecutionTraceInsertParameters" /> and
///     <see cref="AgentExecutionTraceQueryParameters" />, and row mapping in
///     <see cref="AgentExecutionTraceProjectionMapper" />. The <c>Patch*</c> methods share the read-modify-write of the
///     trace blob through <see cref="AgentExecutionTraceJsonPatcher" />.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentExecutionTraceRepository(
    IDbConnectionFactory connectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory)
    : IAgentExecutionTraceRepository
{
    /// <summary>Upper bound on one purge batch, keeping the delete short enough to avoid lock escalation.</summary>
    private const int MaxHardDeleteBatch = 10_000;

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    public async Task CreateAsync(
        AgentExecutionTrace trace,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trace);

        string json = JsonSerializer.Serialize(trace, ContractJson.Default);
        object attemptKey = AgentExecutionTraceInsertParameters.AttemptKey(trace);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        // Re-executing attempt 0 invalidates every retry that followed it (TB-035).
        if (trace.AttemptIndex == 0)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                AgentExecutionTraceSql.DeleteLaterAttempts,
                attemptKey,
                cancellationToken: cancellationToken));
        }

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.DeleteSameAttempt,
            attemptKey,
            cancellationToken: cancellationToken));

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.Insert,
            AgentExecutionTraceInsertParameters.Create(trace, json),
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchBlobStorageFieldsAsync(
        string traceId,
        string? fullSystemPromptBlobKey,
        string? fullUserPromptBlobKey,
        string? fullResponseBlobKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        // Each key is patched only when supplied, so a partial upload does not blank the keys it did not write.
        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey ?? trace.FullSystemPromptBlobKey;
                trace.FullUserPromptBlobKey = fullUserPromptBlobKey ?? trace.FullUserPromptBlobKey;
                trace.FullResponseBlobKey = fullResponseBlobKey ?? trace.FullResponseBlobKey;
            },
            cancellationToken);

        if (patch is null)
            return;

        // Columns take the post-merge values: this statement assigns unconditionally, unlike the COALESCE inline update.
        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateBlobStorageFields,
            new
            {
                TraceId = traceId,
                patch.Trace.FullSystemPromptBlobKey,
                patch.Trace.FullUserPromptBlobKey,
                patch.Trace.FullResponseBlobKey,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchBlobUploadFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateBlobUploadFailed,
            new
            {
                TraceId = traceId,
                BlobUploadFailed = failed
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchInlinePromptFallbackAsync(
        string traceId,
        string? fullSystemPromptInline,
        string? fullUserPromptInline,
        string? fullResponseInline,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.FullSystemPromptInline = fullSystemPromptInline ?? trace.FullSystemPromptInline;
                trace.FullUserPromptInline = fullUserPromptInline ?? trace.FullUserPromptInline;
                trace.FullResponseInline = fullResponseInline ?? trace.FullResponseInline;
            },
            cancellationToken);

        if (patch is null)
            return;

        // The statement COALESCEs each column, so unsupplied arguments leave the stored inline text alone.
        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateInlinePromptFallback,
            new
            {
                TraceId = traceId,
                FullSystemPromptInline = fullSystemPromptInline,
                FullUserPromptInline = fullUserPromptInline,
                FullResponseInline = fullResponseInline,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchInlineFallbackFailedAsync(
        string traceId,
        bool failed,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        // Only the failure is recorded; success leaves the column NULL so "never attempted" and "succeeded" stay alike.
        bool? flag = failed ? true : null;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.InlineFallbackFailed = flag,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateInlineFallbackFailed,
            new
            {
                TraceId = traceId,
                InlineFallbackFailed = flag,
                TraceJson = patch.Json
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchQualityWarningAsync(
        string traceId,
        bool qualityWarning,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.QualityWarning = qualityWarning,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityWarning,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityWarning = qualityWarning
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchQualityRejectedAsync(
        string traceId,
        bool qualityRejected,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateAsync(
            connection,
            traceId,
            trace => trace.QualityRejected = qualityRejected,
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityRejected,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityRejected = qualityRejected
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task PatchQualityGateRecordedSnapshotAsync(
        string traceId,
        AgentOutputQualityGateOutcome recordedOutcome,
        string definitionVersion,
        string definitionContentHashSha256,
        string gateMode,
        QualityGateRecordedEvaluationSnapshot? evaluationSnapshot,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionContentHashSha256);
        ArgumentException.ThrowIfNullOrWhiteSpace(gateMode);

        bool qualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
        bool qualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        // First outcome wins: the read filter and the write predicate both require an unrecorded outcome.
        AgentExecutionTracePatch? patch = await AgentExecutionTraceJsonPatcher.TryMutateUnrecordedQualityGateAsync(
            connection,
            traceId,
            trace =>
            {
                trace.QualityWarning = qualityWarning;
                trace.QualityRejected = qualityRejected;
                trace.QualityGateDefinitionVersion = definitionVersion;
                trace.QualityGateDefinitionContentHashSha256 = definitionContentHashSha256;
                trace.QualityGateDefinitionMode = gateMode;
                trace.RecordedQualityGateOutcome = recordedOutcome;

                if (evaluationSnapshot is not null)
                {
                    trace.RecordedStructuralCompletenessRatio = evaluationSnapshot.StructuralCompletenessRatio;
                    trace.RecordedSemanticScore = evaluationSnapshot.SemanticScore;
                    trace.RecordedRejectReasonCategory = evaluationSnapshot.RejectReasonCategory;
                    trace.RecordedTriageScenarioId = evaluationSnapshot.TriageScenarioId;
                }
            },
            cancellationToken);

        if (patch is null)
            return;

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.UpdateQualityGateRecordedSnapshot,
            new
            {
                TraceId = traceId,
                TraceJson = patch.Json,
                QualityWarning = qualityWarning,
                QualityRejected = qualityRejected,
                QualityGateDefinitionVersion = definitionVersion,
                QualityGateDefinitionContentHashSha256 = definitionContentHashSha256,
                RecordedQualityGateOutcome = (byte)recordedOutcome,
                RecordedStructuralCompletenessRatio = evaluationSnapshot?.StructuralCompletenessRatio,
                RecordedSemanticScore = evaluationSnapshot?.SemanticScore,
                RecordedRejectReasonCategory = evaluationSnapshot?.RejectReasonCategory,
                RecordedTriageScenarioId = evaluationSnapshot?.TriageScenarioId,
            },
            cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<AgentExecutionTrace?> GetByTraceIdAsync(
        string traceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            AgentExecutionTraceSql.SelectTraceJsonByTraceId,
            new
            {
                TraceId = traceId
            },
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeOptionalTrace(rowJson);
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId,
            AgentExecutionTraceQueryParameters.ForRun(scope, runId),
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeTraces(rows, $"run '{runId}'");
    }

    public async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmCostSlice> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmCostSlice>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunId,
                AgentExecutionTraceQueryParameters.ForRun(scope, runId),
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = AgentExecutionTraceQueryParameters.NormalizeRunIds(runIds);

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmCostSliceRow> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmCostSliceRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunIds,
                AgentExecutionTraceQueryParameters.ForRuns(scope, normalized),
                cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.GroupCostSlices(rows, normalized);
    }

    public async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTracePageRow> rows =
            await connection.QueryAsync<AgentExecutionTracePageRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectTraceJsonPagedByRunId,
                AgentExecutionTraceQueryParameters.ForRunPage(scope, runId, offset, limit),
                cancellationToken: cancellationToken));

        List<AgentExecutionTracePageRow> list = rows.ToList();

        IReadOnlyList<AgentExecutionTrace> traces = AgentExecutionTraceProjectionMapper.DeserializeTraces(
            list.Select(static row => row.TraceJson),
            $"run '{runId}' (paged)");

        return (traces, ReadTotalCount(list, static row => row.TotalCount));
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTraceSummary> Summaries, int TotalCount)> GetPagedSummariesByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceSummaryPageRow> rows =
            await connection.QueryAsync<AgentExecutionTraceSummaryPageRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectSummariesPagedByRunId,
                AgentExecutionTraceQueryParameters.ForRunPage(scope, runId, offset, limit),
                cancellationToken: cancellationToken));

        List<AgentExecutionTraceSummaryPageRow> list = rows.ToList();

        return (
            AgentExecutionTraceProjectionMapper.MapSummaries(list),
            ReadTotalCount(list, static row => row.TotalCount));
    }

    /// <inheritdoc />
    public async Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.CountByRunId,
            AgentExecutionTraceQueryParameters.ForRun(scope, runId),
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.SelectTraceJsonByTaskId,
            new
            {
                TaskId = taskId
            },
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeTraces(rows, $"task '{taskId}'");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string normalizedRunId = runId.Trim();

        IReadOnlyDictionary<string, IReadOnlyList<string>> map =
            await GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                scope,
                [normalizedRunId],
                cancellationToken);

        return map.TryGetValue(normalizedRunId, out IReadOnlyList<string>? agentTypes) ? agentTypes : [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = AgentExecutionTraceQueryParameters.NormalizeRunIds(runIds);

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmFallbackRow> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmFallbackRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectDistinctAgentTypesWithLlmFallbackByRunIds,
                AgentExecutionTraceQueryParameters.ForRunsWithLlmFallbackPrefix(scope, normalized),
                cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.GroupFallbackAgentTypes(rows, normalized);
    }

    /// <inheritdoc />
    public async Task<int> HardDeleteTracesArchivedBeforeAsync(
        DateTimeOffset archivedBeforeUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.HardDeleteArchivedBefore,
            new
            {
                Batch = Math.Clamp(maxRows, 1, MaxHardDeleteBatch),
                ArchivedBeforeUtc = archivedBeforeUtc.UtcDateTime
            },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    ///     Reads the window-aggregate total repeated on every page row; an empty page means no matching rows at all.
    /// </summary>
    private static int ReadTotalCount<TRow>(List<TRow> page, Func<TRow, int> totalCountSelector) =>
        page.Count > 0 ? totalCountSelector(page[0]) : 0;
}
