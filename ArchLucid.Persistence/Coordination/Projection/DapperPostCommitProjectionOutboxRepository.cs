using System.Diagnostics.CodeAnalysis;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Orchestration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>
///     Dapper implementation of <see cref="IPostCommitProjectionOutboxRepository" /> over
///     <c>dbo.PostCommitProjectionOutbox</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.")]
public sealed class DapperPostCommitProjectionOutboxRepository(ISqlConnectionFactory connectionFactory)
    : IPostCommitProjectionOutboxRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        string workType,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        string? payloadJson,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workType);

        Guid outboxId = Guid.NewGuid();
        const string sql = """
                           INSERT INTO dbo.PostCommitProjectionOutbox
                           (OutboxId, WorkType, RunId, TenantId, WorkspaceId, ProjectId, PayloadJson, CreatedUtc)
                           VALUES (@OutboxId, @WorkType, @RunId, @TenantId, @WorkspaceId, @ProjectId, @PayloadJson, SYSUTCDATETIME());
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    OutboxId = outboxId,
                    WorkType = workType,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    PayloadJson = payloadJson
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PostCommitProjectionOutboxEntry>> DequeuePendingAsync(
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
                               FROM dbo.PostCommitProjectionOutbox WITH (READPAST, UPDLOCK, ROWLOCK)
                               WHERE ProcessedUtc IS NULL
                                 AND DeadLetteredUtc IS NULL
                                 AND (NextAttemptUtc IS NULL OR NextAttemptUtc <= SYSUTCDATETIME())
                                 AND (LockedUntilUtc IS NULL OR LockedUntilUtc <= SYSUTCDATETIME())
                               ORDER BY CreatedUtc ASC, OutboxId ASC)
                           UPDATE o
                               SET LockedUntilUtc = DATEADD(second, @LeaseSeconds, SYSUTCDATETIME())
                           OUTPUT inserted.OutboxId,
                                  inserted.WorkType,
                                  inserted.RunId,
                                  inserted.TenantId,
                                  inserted.WorkspaceId,
                                  inserted.ProjectId,
                                  inserted.PayloadJson,
                                  inserted.CreatedUtc,
                                  inserted.AttemptCount,
                                  inserted.LockedUntilUtc,
                                  inserted.NextAttemptUtc,
                                  inserted.LastAttemptError,
                                  inserted.DeadLetteredUtc
                               FROM dbo.PostCommitProjectionOutbox AS o
                               INNER JOIN cte ON cte.OutboxId = o.OutboxId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<PostCommitProjectionOutboxEntry> rows = await connection.QueryAsync<PostCommitProjectionOutboxEntry>(
            new CommandDefinition(sql, new { Take = take, LeaseSeconds = lease }, cancellationToken: ct));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.PostCommitProjectionOutbox
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
                           UPDATE dbo.PostCommitProjectionOutbox
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
                           UPDATE dbo.PostCommitProjectionOutbox
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
                           FROM dbo.PostCommitProjectionOutbox
                           WHERE ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<long> CountDeadLetteredAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.PostCommitProjectionOutbox
                           WHERE DeadLetteredUtc IS NOT NULL
                             AND ProcessedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, cancellationToken: ct));
    }

    private static DateTime NormalizeSqlUtc(DateTime value)
    {
        return value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
