using System.Data;
using ArchLucid.Core.Tenancy;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Cosmos;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.")]
public sealed class DapperCosmosGraphSnapshotOutboxRepository(ISqlConnectionFactory connectionFactory)
    : ICosmosGraphSnapshotOutboxRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        Guid outboxId = Guid.NewGuid();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await EnqueueCoreAsync(
            connection,
            null,
            outboxId,
            graphSnapshotId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        Guid outboxId = Guid.NewGuid();

        return EnqueueCoreAsync(
            connection,
            transaction,
            outboxId,
            graphSnapshotId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CosmosGraphSnapshotOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(maxBatch, 1, 100);
        int lease = Math.Clamp(leaseDurationSeconds, 60, 7200);

        const string sql = """
                           ;WITH cte AS (
                               SELECT TOP (@Take)
                                   OutboxId
                               FROM dbo.CosmosGraphSnapshotOutbox AS o WITH (READPAST, UPDLOCK, ROWLOCK)
                               WHERE o.ProcessedUtc IS NULL
                                 AND o.DeadLetteredUtc IS NULL
                                 AND (o.NextAttemptUtc IS NULL OR o.NextAttemptUtc <= SYSUTCDATETIME())
                                 AND (o.LockedUntilUtc IS NULL OR o.LockedUntilUtc <= SYSUTCDATETIME())
                               ORDER BY o.CreatedUtc ASC, o.OutboxId ASC)
                           UPDATE o
                               SET LockedUntilUtc = DATEADD(second, @LeaseSeconds, SYSUTCDATETIME())
                           OUTPUT inserted.OutboxId,
                                  inserted.GraphSnapshotId,
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
                               FROM dbo.CosmosGraphSnapshotOutbox AS o
                               INNER JOIN cte ON cte.OutboxId = o.OutboxId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<CosmosGraphSnapshotOutboxEntry> rows =
            await connection.QueryAsync<CosmosGraphSnapshotOutboxEntry>(
                new CommandDefinition(sql, new { Take = take, LeaseSeconds = lease }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.CosmosGraphSnapshotOutbox
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
                           UPDATE dbo.CosmosGraphSnapshotOutbox
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
            new CommandDefinition(
                sql,
                new { OutboxId = outboxId, NextAttemptUtc = NormalizeSqlUtc(nextAttemptUtc), Err = err },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);
        const string sql = """
                           UPDATE dbo.CosmosGraphSnapshotOutbox
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

    private static async Task EnqueueCoreAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid outboxId,
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.CosmosGraphSnapshotOutbox
                           (OutboxId, GraphSnapshotId, RunId, TenantId, WorkspaceId, ProjectId, CreatedUtc)
                           VALUES (@OutboxId, @GraphSnapshotId, @RunId, @TenantId, @WorkspaceId, @ProjectId, SYSUTCDATETIME());
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    OutboxId = outboxId,
                    GraphSnapshotId = graphSnapshotId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                },
                transaction,
                cancellationToken: cancellationToken));
    }

    private static DateTime NormalizeSqlUtc(DateTime value)
    {
        return value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
