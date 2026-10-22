using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
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
public sealed partial class AgentExecutionTraceRepository(
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
}
