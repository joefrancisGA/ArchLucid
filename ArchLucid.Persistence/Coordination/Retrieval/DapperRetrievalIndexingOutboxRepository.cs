using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Retrieval;

/// <summary>
///     Dapper implementation of <see cref="IRetrievalIndexingOutboxRepository" /> over
///     <c>dbo.RetrievalIndexingOutbox</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperRetrievalIndexingOutboxRepository(ISqlConnectionFactory connectionFactory)
    : IRetrievalIndexingOutboxRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        Guid outboxId = Guid.NewGuid();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await EnqueueCoreAsync(
            connection,
            null,
            outboxId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        Guid outboxId = Guid.NewGuid();

        return EnqueueCoreAsync(
            connection,
            transaction,
            outboxId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalIndexingOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken ct)
    {
        int take = Math.Clamp(maxBatch, 1, 100);
        int lease = Math.Clamp(leaseDurationSeconds, 60, 7200);

        const string sql = """
                           ;WITH cte AS (
                               SELECT TOP (@Take)
                                   OutboxId
                               FROM dbo.RetrievalIndexingOutbox WITH (READPAST, UPDLOCK, ROWLOCK)
                               WHERE ProcessedUtc IS NULL
                                 AND DeadLetteredUtc IS NULL
                                 AND (NextAttemptUtc IS NULL OR NextAttemptUtc <= SYSUTCDATETIME())
                                 AND (LockedUntilUtc IS NULL OR LockedUntilUtc <= SYSUTCDATETIME())
                               ORDER BY CreatedUtc ASC, OutboxId ASC)
                           UPDATE o
                               SET LockedUntilUtc = DATEADD(second, @LeaseSeconds, SYSUTCDATETIME())
                           OUTPUT inserted.OutboxId,
                                  inserted.RunId,
                                  inserted.TenantId,
                                  inserted.WorkspaceId,
                                  inserted.ProjectId,
                                  inserted.CreatedUtc,
                                  inserted.AttemptCount,
                                  inserted.LockedUntilUtc,
                                  inserted.NextAttemptUtc,
                                  inserted.LastAttemptError,
                                  inserted.DeadLetteredUtc
                               FROM dbo.RetrievalIndexingOutbox AS o
                               INNER JOIN cte ON cte.OutboxId = o.OutboxId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<RetrievalIndexingOutboxEntry> rows = await connection.QueryAsync<RetrievalIndexingOutboxEntry>(
            new CommandDefinition(sql, new { Take = take, LeaseSeconds = lease }, cancellationToken: ct));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.RetrievalIndexingOutbox
                           SET ProcessedUtc = SYSUTCDATETIME(),
                               LockedUntilUtc = NULL
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { OutboxId = outboxId }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);
        const string sql = """
                           UPDATE dbo.RetrievalIndexingOutbox
                           SET LockedUntilUtc = NULL,
                               AttemptCount = AttemptCount + 1,
                               NextAttemptUtc = @NextAttemptUtc,
                               LastAttemptError = @Err
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { OutboxId = outboxId, NextAttemptUtc = NormalizeSqlUtc(nextAttemptUtc), Err = err },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);
        const string sql = """
                           UPDATE dbo.RetrievalIndexingOutbox
                           SET LockedUntilUtc = NULL,
                               AttemptCount = AttemptCount + 1,
                               DeadLetteredUtc = SYSUTCDATETIME(),
                               LastAttemptError = @Err,
                               NextAttemptUtc = NULL
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { OutboxId = outboxId, Err = err }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<long> CountPendingAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.RetrievalIndexingOutbox
                           WHERE ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        long count = await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, cancellationToken: ct));

        return count;
    }

    /// <inheritdoc />
    public async Task<long> CountDeadLetteredAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.RetrievalIndexingOutbox
                           WHERE DeadLetteredUtc IS NOT NULL
                             AND ProcessedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, cancellationToken: ct));
    }

    private static async Task EnqueueCoreAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid outboxId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO dbo.RetrievalIndexingOutbox
                           (OutboxId, RunId, TenantId, WorkspaceId, ProjectId, CreatedUtc)
                           VALUES (@OutboxId, @RunId, @TenantId, @WorkspaceId, @ProjectId, SYSUTCDATETIME());
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                },
                transaction,
                cancellationToken: ct));
    }

    private static DateTime NormalizeSqlUtc(DateTime value)
    {
        return value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
