using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>Dapper implementation over <c>dbo.AuthorityPipelineWorkOutbox</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class DapperAuthorityPipelineWorkRepository(ISqlConnectionFactory connectionFactory)
    : IAuthorityPipelineWorkRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);

        const string sql = """
                           INSERT INTO dbo.AuthorityPipelineWorkOutbox
                           (OutboxId, RunId, TenantId, WorkspaceId, ProjectId, PayloadJson, CreatedUtc)
                           VALUES (@OutboxId, @RunId, @TenantId, @WorkspaceId, @ProjectId, @PayloadJson, SYSUTCDATETIME());
                           """;

        Guid outboxId = Guid.NewGuid();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    PayloadJson = payloadJson
                },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuthorityPipelineWorkOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(maxBatch, 1, 100);
        int lease = Math.Clamp(leaseDurationSeconds, 60, 7200);

        const string sql = """
                           ;WITH cte AS (
                               SELECT TOP (@Take)
                                   o.OutboxId
                               FROM dbo.AuthorityPipelineWorkOutbox AS o WITH (READPAST, UPDLOCK, ROWLOCK)
                               WHERE o.ProcessedUtc IS NULL
                                 AND o.DeadLetteredUtc IS NULL
                                 AND (o.NextAttemptUtc IS NULL OR o.NextAttemptUtc <= SYSUTCDATETIME())
                                 AND (o.LockedUntilUtc IS NULL OR o.LockedUntilUtc <= SYSUTCDATETIME())
                               ORDER BY o.CreatedUtc ASC)
                           UPDATE o
                               SET LockedUntilUtc = DATEADD(second, @LeaseSeconds, SYSUTCDATETIME())
                           OUTPUT inserted.OutboxId,
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
                               FROM dbo.AuthorityPipelineWorkOutbox AS o
                               INNER JOIN cte ON cte.OutboxId = o.OutboxId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<AuthorityPipelineWorkOutboxEntry> rows =
            await connection.QueryAsync<AuthorityPipelineWorkOutboxEntry>(
                new CommandDefinition(sql,
                    new { Take = take, LeaseSeconds = lease },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.AuthorityPipelineWorkOutbox
                           SET ProcessedUtc = SYSUTCDATETIME(),
                               LockedUntilUtc = NULL
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { OutboxId = outboxId }, cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);
        const string sql = """
                           UPDATE dbo.AuthorityPipelineWorkOutbox
                           SET LockedUntilUtc = NULL,
                               AttemptCount = AttemptCount + 1,
                               NextAttemptUtc = @NextAttemptUtc,
                               LastAttemptError = @Err
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(sql,
                new { OutboxId = outboxId, NextAttemptUtc = NormalizeSqlUtc(nextAttemptUtc), Err = err },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task RecordDeadLetterAsync(Guid outboxId, string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);
        const string sql = """
                           UPDATE dbo.AuthorityPipelineWorkOutbox
                           SET LockedUntilUtc = NULL,
                               AttemptCount = AttemptCount + 1,
                               DeadLetteredUtc = SYSUTCDATETIME(),
                               LastAttemptError = @Err,
                               NextAttemptUtc = NULL
                           WHERE OutboxId = @OutboxId
                             AND ProcessedUtc IS NULL
                             AND DeadLetteredUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(sql, new { OutboxId = outboxId, Err = err }, cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public Task<long> CountPendingAsync(CancellationToken cancellationToken = default) =>
        CountWhereAsync("""
                         SELECT COUNT_BIG(1)
                         FROM dbo.AuthorityPipelineWorkOutbox
                         WHERE ProcessedUtc IS NULL
                           AND DeadLetteredUtc IS NULL;
                         """,
            cancellationToken);

    /// <inheritdoc />
    public Task<long> CountActionablePendingAsync(CancellationToken cancellationToken = default) =>
        CountWhereAsync("""
                         SELECT COUNT_BIG(1)
                         FROM dbo.AuthorityPipelineWorkOutbox
                         WHERE ProcessedUtc IS NULL
                           AND DeadLetteredUtc IS NULL
                           AND (NextAttemptUtc IS NULL OR NextAttemptUtc <= SYSUTCDATETIME())
                           AND (LockedUntilUtc IS NULL OR LockedUntilUtc <= SYSUTCDATETIME());
                         """,
            cancellationToken);

    /// <inheritdoc />
    public Task<long> CountDeadLetteredAsync(CancellationToken cancellationToken = default) =>
        CountWhereAsync("""
                         SELECT COUNT_BIG(1)
                         FROM dbo.AuthorityPipelineWorkOutbox
                         WHERE DeadLetteredUtc IS NOT NULL
                           AND ProcessedUtc IS NULL;
                         """,
            cancellationToken);

    private async Task<long> CountWhereAsync(string sql, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    private static DateTime NormalizeSqlUtc(DateTime value)
    {
        return value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
