using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared read-modify-write of the <c>TraceJson</c> blob behind the repository's <c>Patch*</c> methods.
/// </summary>
/// <remarks>
///     A missing row or an unreadable blob yields <see langword="null" /> instead of throwing: patches carry
///     supplementary forensics (blob keys, quality flags) written after the trace itself, and failing them would fail
///     the run that produced the trace.
/// </remarks>
internal static class AgentExecutionTraceJsonPatcher
{
    /// <summary>
    ///     Applies <paramref name="mutate" /> to the stored trace, or returns <see langword="null" /> when there is
    ///     nothing to patch.
    /// </summary>
    public static async Task<AgentExecutionTracePatch?> TryMutateAsync(
        IDbConnection connection,
        string traceId,
        Action<AgentExecutionTrace> mutate,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connection);

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            AgentExecutionTraceSql.SelectTraceJsonByTraceId,
            new
            {
                TraceId = traceId
            },
            cancellationToken: cancellationToken));

        return Mutate(rowJson, mutate);
    }

    /// <summary>
    ///     Quality-gate snapshot variant: the first recorded outcome wins, so a row that already carries an outcome is
    ///     left untouched.
    /// </summary>
    public static async Task<AgentExecutionTracePatch?> TryMutateUnrecordedQualityGateAsync(
        IDbConnection connection,
        string traceId,
        Action<AgentExecutionTrace> mutate,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connection);

        (string? RowJson, byte? ExistingOutcome)? row =
            await connection.QuerySingleOrDefaultAsync<(string? RowJson, byte? ExistingOutcome)>(new CommandDefinition(
                AgentExecutionTraceSql.SelectTraceJsonAndRecordedOutcomeByTraceId,
                new
                {
                    TraceId = traceId
                },
                cancellationToken: cancellationToken));

        if (row?.ExistingOutcome is not null)
            return null;

        return Mutate(row?.RowJson, mutate);
    }

    private static AgentExecutionTracePatch? Mutate(string? rowJson, Action<AgentExecutionTrace> mutate)
    {
        ArgumentNullException.ThrowIfNull(mutate);

        if (string.IsNullOrEmpty(rowJson))
            return null;

        AgentExecutionTrace? trace = JsonSerializer.Deserialize<AgentExecutionTrace>(rowJson, ContractJson.Default);

        if (trace is null)
            return null;

        mutate(trace);

        return new AgentExecutionTracePatch(trace, JsonSerializer.Serialize(trace, ContractJson.Default));
    }
}
