using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
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
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentExecutionTraceRepository(
    IDbConnectionFactory connectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory)
    : IAgentExecutionTraceRepository
{
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

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        object scopeArgs = new
        {
            RunId = SqlRunIdMapping.ToSqlRunId(trace.RunId),
            trace.TaskId,
            AgentType = trace.AgentType.ToString(),
            trace.AttemptIndex
        };

        if (trace.AttemptIndex == 0)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                AgentExecutionTraceSql.DeleteLaterAttempts,
                scopeArgs,
                cancellationToken: cancellationToken));
        }

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.DeleteSameAttempt,
            scopeArgs,
            cancellationToken: cancellationToken));

        await connection.ExecuteAsync(new CommandDefinition(
            AgentExecutionTraceSql.Insert,
            new
            {
                trace.TraceId,
                RunId = SqlRunIdMapping.ToSqlRunId(trace.RunId),
                trace.TaskId,
                AgentType = trace.AgentType.ToString(),
                trace.AttemptIndex,
                trace.ParseSucceeded,
                trace.ErrorMessage,
                TraceJson = json,
                trace.CreatedUtc,
                trace.FullSystemPromptBlobKey,
                trace.FullUserPromptBlobKey,
                trace.FullResponseBlobKey,
                trace.ModelDeploymentName,
                trace.ModelVersion,
                trace.SystemPromptContentHash,
                trace.InputTokenCount,
                trace.OutputTokenCount,
                trace.ReasoningTokenCount,
                trace.EstimatedCostUsd,
                ModelAlias = TruncateModelAlias(trace.ModelAlias),
                trace.QualityWarning,
                trace.QualityRejected
            },
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

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(AgentExecutionTraceSql.SelectTraceJsonByTraceId, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(rowJson))
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return;

        if (fullSystemPromptBlobKey is not null)

            trace.FullSystemPromptBlobKey = fullSystemPromptBlobKey;

        if (fullUserPromptBlobKey is not null)

            trace.FullUserPromptBlobKey = fullUserPromptBlobKey;

        if (fullResponseBlobKey is not null)

            trace.FullResponseBlobKey = fullResponseBlobKey;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateBlobStorageFields,
                new
                {
                    TraceId = traceId,
                    trace.FullSystemPromptBlobKey,
                    trace.FullUserPromptBlobKey,
                    trace.FullResponseBlobKey,
                    TraceJson = updatedJson
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

        const string sql = AgentExecutionTraceSql.UpdateBlobUploadFailed;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
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

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(AgentExecutionTraceSql.SelectTraceJsonByTraceId, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(rowJson))
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return;

        if (fullSystemPromptInline is not null)

            trace.FullSystemPromptInline = fullSystemPromptInline;

        if (fullUserPromptInline is not null)

            trace.FullUserPromptInline = fullUserPromptInline;

        if (fullResponseInline is not null)

            trace.FullResponseInline = fullResponseInline;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateInlinePromptFallback,
                new
                {
                    TraceId = traceId,
                    FullSystemPromptInline = fullSystemPromptInline,
                    FullUserPromptInline = fullUserPromptInline,
                    FullResponseInline = fullResponseInline,
                    TraceJson = updatedJson
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

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(AgentExecutionTraceSql.SelectTraceJsonByTraceId, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(rowJson))
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return;

        trace.InlineFallbackFailed = failed ? true : null;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateInlineFallbackFailed,
                new
                {
                    TraceId = traceId,
                    InlineFallbackFailed = failed ? true : (bool?)null,
                    TraceJson = updatedJson
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

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(AgentExecutionTraceSql.SelectTraceJsonByTraceId, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(rowJson))
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return;

        trace.QualityWarning = qualityWarning;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateQualityWarning,
                new
                {
                    TraceId = traceId,
                    TraceJson = updatedJson,
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

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(AgentExecutionTraceSql.SelectTraceJsonByTraceId, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(rowJson))
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return;

        trace.QualityRejected = qualityRejected;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateQualityRejected,
                new
                {
                    TraceId = traceId,
                    TraceJson = updatedJson,
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
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(definitionContentHashSha256);
        ArgumentException.ThrowIfNullOrWhiteSpace(gateMode);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string selectSql = AgentExecutionTraceSql.SelectTraceJsonAndRecordedOutcomeByTraceId;

        (string? RowJson, byte? ExistingOutcome)? row = await connection.QuerySingleOrDefaultAsync<(string? RowJson, byte? ExistingOutcome)>(
            new CommandDefinition(selectSql, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        if (string.IsNullOrEmpty(row?.RowJson) || row.Value.ExistingOutcome is not null)
            return;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(row.Value.RowJson, ContractJson.Default);

        if (trace is null)
            return;

        bool qualityWarning = recordedOutcome == AgentOutputQualityGateOutcome.Warned;
        bool qualityRejected = recordedOutcome == AgentOutputQualityGateOutcome.Rejected;

        trace.QualityWarning = qualityWarning;
        trace.QualityRejected = qualityRejected;
        trace.QualityGateDefinitionVersion = definitionVersion;
        trace.QualityGateDefinitionContentHashSha256 = definitionContentHashSha256;
        trace.QualityGateDefinitionMode = gateMode;
        trace.RecordedQualityGateOutcome = recordedOutcome;

        string updatedJson = JsonSerializer.Serialize(trace, ContractJson.Default);
        byte recordedOutcomeByte = (byte)recordedOutcome;

        await connection.ExecuteAsync(
            new CommandDefinition(
                AgentExecutionTraceSql.UpdateQualityGateRecordedSnapshot,
                new
                {
                    TraceId = traceId,
                    TraceJson = updatedJson,
                    QualityWarning = qualityWarning,
                    QualityRejected = qualityRejected,
                    QualityGateDefinitionVersion = definitionVersion,
                    QualityGateDefinitionContentHashSha256 = definitionContentHashSha256,
                    RecordedQualityGateOutcome = recordedOutcomeByte,
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

        const string sql = AgentExecutionTraceSql.SelectTraceJsonByTraceId;

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(sql, new
            {
                TraceId = traceId
            }, cancellationToken: cancellationToken));

        return string.IsNullOrEmpty(rowJson) ? null : JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId;

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            sql,
            new
            {
                RunId = SqlRunIdMapping.ToSqlRunId(runId),
                scope.TenantId,
                scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            },
            cancellationToken: cancellationToken));

        return DeserializeTraces(rows, $"run '{runId}'");
    }

    public async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunId;

        IEnumerable<AgentExecutionTraceLlmCostSlice> rows = await connection.QueryAsync<AgentExecutionTraceLlmCostSlice>(
            new CommandDefinition(
                sql,
                new
                {
                    RunId = SqlRunIdMapping.ToSqlRunId(runId),
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        Guid[] runIdsParameter = normalized.Select(SqlRunIdMapping.ToSqlRunId).ToArray();

        string sql = AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunIds;

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<LlmCostSliceRow> rows = await connection.QueryAsync<LlmCostSliceRow>(
            new CommandDefinition(
                sql,
                new
                {
                    RunIds = runIdsParameter,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));

        Dictionary<string, List<AgentExecutionTraceLlmCostSlice>> grouped =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (LlmCostSliceRow row in rows)
        {
            string contractRunId = SqlRunIdMapping.ToContractRunId(row.RunId);

            if (!grouped.TryGetValue(contractRunId, out List<AgentExecutionTraceLlmCostSlice>? list))
            {
                list = [];
                grouped[contractRunId] = list;
            }

            list.Add(new AgentExecutionTraceLlmCostSlice
            {
                ModelDeploymentName = row.ModelDeploymentName,
                InputTokenCount = row.InputTokenCount,
                OutputTokenCount = row.OutputTokenCount,
                ReasoningTokenCount = row.ReasoningTokenCount,
            });
        }

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> result =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (string runId in normalized)
        {
            result[runId] = grouped.TryGetValue(runId, out List<AgentExecutionTraceLlmCostSlice>? slices)
                ? slices
                : [];
        }

        return result;
    }

    public async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        string sql = AgentExecutionTraceQueryShapes.SelectTraceJsonPagedByRunId;

        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<TracePageRow> rows = await connection.QueryAsync<TracePageRow>(new CommandDefinition(
            sql,
            new
            {
                RunId = SqlRunIdMapping.ToSqlRunId(runId),
                scope.TenantId,
                scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                Offset = clampedOffset,
                Limit = clampedLimit
            },
            cancellationToken: cancellationToken));

        List<TracePageRow> list = rows.ToList();
        int totalCount = list.Count > 0 ? list[0].TotalCount : 0;

        IReadOnlyList<AgentExecutionTrace> traces =
            DeserializeTraces(list.Select(row => row.TraceJson), $"run '{runId}' (paged)");

        return (traces, totalCount);
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

        string sql = AgentExecutionTraceQueryShapes.SelectSummariesPagedByRunId;

        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<TraceSummaryPageRow> rows = await connection.QueryAsync<TraceSummaryPageRow>(new CommandDefinition(
            sql,
            new
            {
                RunId = SqlRunIdMapping.ToSqlRunId(runId),
                scope.TenantId,
                scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                Offset = clampedOffset,
                Limit = clampedLimit
            },
            cancellationToken: cancellationToken));

        List<TraceSummaryPageRow> list = rows.ToList();
        int totalCount = list.Count > 0 ? list[0].TotalCount : 0;

        List<AgentExecutionTraceSummary> summaries = list.Select(MapSummaryRow).ToList();

        return (summaries, totalCount);
    }

    /// <inheritdoc />
    public async Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        string sql = AgentExecutionTraceQueryShapes.CountByRunId;

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new
            {
                RunId = SqlRunIdMapping.ToSqlRunId(runId),
                scope.TenantId,
                scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = AgentExecutionTraceQueryShapes.SelectTraceJsonByTaskId;

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            sql,
            new
            {
                TaskId = taskId
            },
            cancellationToken: cancellationToken));

        return DeserializeTraces(rows, $"task '{taskId}'");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        IReadOnlyDictionary<string, IReadOnlyList<string>> map =
            await GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                scope,
                [runId.Trim()],
                cancellationToken);

        return map.TryGetValue(runId.Trim(), out IReadOnlyList<string>? list) ? list : [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        const string pattern = AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "%";

        // List<string> is globally mapped to JSON via ListStringTypeHandler, which prevents Dapper's IN-list expansion.
        Guid[] runIdsParameter = normalized.Select(SqlRunIdMapping.ToSqlRunId).ToArray();

        string sql = AgentExecutionTraceQueryShapes.SelectDistinctAgentTypesWithLlmFallbackByRunIds;

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<LlmFallbackAgentTypeRow> rows = await connection.QueryAsync<LlmFallbackAgentTypeRow>(
            new CommandDefinition(sql, new
            {
                RunIds = runIdsParameter,
                PrefixPattern = pattern,
                scope.TenantId,
                scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
            },
                cancellationToken: cancellationToken));

        Dictionary<Guid, List<string>> grouped = [];

        foreach (LlmFallbackAgentTypeRow row in rows)
        {
            if (!grouped.TryGetValue(row.RunId, out List<string>? list))
            {
                list = [];
                grouped[row.RunId] = list;
            }

            if (!string.IsNullOrWhiteSpace(row.AgentType))
                list.Add(row.AgentType.Trim());
        }

        Dictionary<string, IReadOnlyList<string>> result = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rid in normalized)
        {
            Guid runKey = SqlRunIdMapping.ToSqlRunId(rid);

            if (!grouped.TryGetValue(runKey, out List<string>? agents))
            {
                result[rid] = [];

                continue;
            }

            List<string> ordered = agents
                .Where(static s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static s => s, StringComparer.OrdinalIgnoreCase)
                .ToList();

            result[rid] = ordered;
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<int> HardDeleteTracesArchivedBeforeAsync(
        DateTimeOffset archivedBeforeUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        int batch = Math.Clamp(maxRows, 1, 10_000);

        const string sql = AgentExecutionTraceSql.HardDeleteArchivedBefore;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int deleted = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Batch = batch,
                    ArchivedBeforeUtc = archivedBeforeUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return deleted;
    }

    private static IReadOnlyList<AgentExecutionTrace> DeserializeTraces(
        IEnumerable<string> jsonRows,
        string context)
    {
        List<AgentExecutionTrace> traces = [];

        foreach (string json in jsonRows)
        {
            AgentExecutionTrace? trace;
            try
            {
                trace = JsonSerializer.Deserialize<AgentExecutionTrace>(json, ContractJson.Default);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Failed to deserialize an AgentExecutionTrace for {context}. " +
                    "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
            }

            if (trace is null)

                throw new InvalidOperationException(
                    $"An AgentExecutionTrace row for {context} deserialized to null. " +
                    "The stored JSON may be empty or corrupt.");

            traces.Add(trace);
        }

        return traces;
    }

    private sealed class LlmCostSliceRow
    {
        public Guid RunId
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }

        public int? InputTokenCount
        {
            get;
            init;
        }

        public int? OutputTokenCount
        {
            get;
            init;
        }

        public int? ReasoningTokenCount
        {
            get;
            init;
        }
    }

    private sealed class LlmFallbackAgentTypeRow
    {
        public Guid RunId
        {
            get;
            init;
        }

        public string AgentType
        {
            get;
            init;
        } = string.Empty;
    }

    private sealed class TracePageRow
    {
        public string TraceJson
        {
            get;
            init;
        } = string.Empty;

        public int TotalCount
        {
            get;
            init;
        }
    }

    private sealed class TraceSummaryPageRow
    {
        public string TraceId
        {
            get;
            init;
        } = string.Empty;

        public Guid RunId
        {
            get;
            init;
        }

        public string TaskId
        {
            get;
            init;
        } = string.Empty;

        public string AgentType
        {
            get;
            init;
        } = string.Empty;

        public bool ParseSucceeded
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }

        public bool? BlobUploadFailed
        {
            get;
            init;
        }

        public int? InputTokenCount
        {
            get;
            init;
        }

        public int? OutputTokenCount
        {
            get;
            init;
        }

        public decimal? EstimatedCostUsd
        {
            get;
            init;
        }

        public string? ModelAlias
        {
            get;
            init;
        }

        public bool QualityWarning
        {
            get;
            init;
        }

        public bool QualityRejected
        {
            get;
            init;
        }

        public int TotalCount
        {
            get;
            init;
        }
    }

    private static AgentExecutionTraceSummary MapSummaryRow(TraceSummaryPageRow row)
    {
        if (!Enum.TryParse(row.AgentType, ignoreCase: true, out AgentType agentType))

            throw new InvalidOperationException(
                $"AgentExecutionTraces.AgentType value '{row.AgentType}' is not a known AgentType.");

        return new AgentExecutionTraceSummary
        {
            TraceId = row.TraceId,
            RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
            TaskId = row.TaskId,
            AgentType = agentType,
            ParseSucceeded = row.ParseSucceeded,
            CreatedUtc = row.CreatedUtc,
            ModelDeploymentName = row.ModelDeploymentName,
            BlobUploadFailed = row.BlobUploadFailed,
            InputTokenCount = row.InputTokenCount,
            OutputTokenCount = row.OutputTokenCount,
            EstimatedCostUsd = row.EstimatedCostUsd,
            ModelAlias = row.ModelAlias,
            QualityWarning = row.QualityWarning,
            QualityRejected = row.QualityRejected,
        };
    }

    /// <summary>Matches <c>dbo.AgentExecutionTraces.ModelAlias</c> NVARCHAR(260).</summary>
    private static string? TruncateModelAlias(string? modelAlias)
    {
        if (string.IsNullOrEmpty(modelAlias))
            return modelAlias;

        if (modelAlias.Length <= 260)
            return modelAlias;

        return modelAlias[..260];
    }
}
