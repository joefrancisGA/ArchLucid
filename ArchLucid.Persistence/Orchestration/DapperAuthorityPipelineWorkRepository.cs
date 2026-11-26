using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>Dapper implementation over <c>dbo.AuthorityPipelineWorkOutbox</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Authority pipeline outbox worker dequeues by work id within tenant catalog.")]
public sealed class DapperAuthorityPipelineWorkRepository(ISqlConnectionFactory connectionFactory)
    : IAuthorityPipelineWorkRepository
{
    private const string ActiveDrainPredicate = """
        AND (@DrainTenantId IS NULL OR o.TenantId = @DrainTenantId)
        AND (@DrainWorkspaceId IS NULL OR o.WorkspaceId = @DrainWorkspaceId)
        AND (@DrainProjectId IS NULL OR o.ProjectId = @DrainProjectId)
        """;

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

        Guid outboxId = Guid.NewGuid();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await EnqueueCoreAsync(
            connection,
            null,
            outboxId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            payloadJson,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);

        Guid outboxId = Guid.NewGuid();

        return EnqueueCoreAsync(
            connection,
            transaction,
            outboxId,
            runId,
            tenantId,
            workspaceId,
            projectId,
            payloadJson,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AuthorityPipelineWorkOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default)
    {
        int take = AuthorityPipelineWorkRepositoryCore.ClampDequeueBatch(maxBatch);
        int lease = AuthorityPipelineWorkRepositoryCore.ClampLeaseDurationSeconds(leaseDurationSeconds);

        // Fair dequeue: ROW_NUMBER per TenantId (FIFO within tenant); global sort takes round k from each tenant before any k+1.
        string sql = $"""
                           ;WITH numbered AS (
                               SELECT
                                   o.OutboxId,
                                   o.TenantId,
                                   o.CreatedUtc,
                                   ROW_NUMBER() OVER (
                                       PARTITION BY o.TenantId
                                       ORDER BY o.CreatedUtc ASC, o.OutboxId ASC) AS TenantSeq
                               FROM dbo.AuthorityPipelineWorkOutbox AS o WITH (READPAST, UPDLOCK, READCOMMITTEDLOCK)
                               WHERE o.ProcessedUtc IS NULL
                                 AND o.DeadLetteredUtc IS NULL
                                 AND (o.NextAttemptUtc IS NULL OR o.NextAttemptUtc <= SYSUTCDATETIME())
                                 AND (o.LockedUntilUtc IS NULL OR o.LockedUntilUtc <= SYSUTCDATETIME())
                                 {ActiveDrainPredicate}),
                           cte AS (
                               SELECT TOP (@Take)
                                   n.OutboxId
                               FROM numbered AS n
                               ORDER BY n.TenantSeq ASC, n.TenantId ASC, n.CreatedUtc ASC, n.OutboxId ASC)
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

        DynamicParameters parameters = new(GetActiveDrainParameters());
        parameters.Add("Take", take);
        parameters.Add("LeaseSeconds", lease);
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<AuthorityPipelineWorkOutboxEntry> rows =
            await connection.QueryAsync<AuthorityPipelineWorkOutboxEntry>(
                new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));

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
        CountWhereAsync($"""
                         SELECT COUNT_BIG(1)
                         FROM dbo.AuthorityPipelineWorkOutbox AS o
                         WHERE o.ProcessedUtc IS NULL
                           AND o.DeadLetteredUtc IS NULL
                           AND (o.NextAttemptUtc IS NULL OR o.NextAttemptUtc <= SYSUTCDATETIME())
                           AND (o.LockedUntilUtc IS NULL OR o.LockedUntilUtc <= SYSUTCDATETIME())
                           {ActiveDrainPredicate};
                         """,
            cancellationToken, GetActiveDrainParameters());

    /// <inheritdoc />
    public Task<long> CountDeadLetteredAsync(CancellationToken cancellationToken = default) =>
        CountWhereAsync("""
                         SELECT COUNT_BIG(1)
                         FROM dbo.AuthorityPipelineWorkOutbox
                         WHERE DeadLetteredUtc IS NOT NULL
                           AND ProcessedUtc IS NULL;
                         """,
            cancellationToken);

    private static object GetActiveDrainParameters()
    {
        ScopeContext? activeDrain = AmbientScopeContext.CurrentOverride;
        static Guid? NonEmpty(Guid? value) => value == Guid.Empty ? null : value;
        return new
        {
            DrainTenantId = NonEmpty(activeDrain?.TenantId),
            DrainWorkspaceId = NonEmpty(activeDrain?.WorkspaceId),
            DrainProjectId = NonEmpty(activeDrain?.ProjectId),
        };
    }

    private async Task<long> CountWhereAsync(string sql, CancellationToken cancellationToken, object? parameters = null)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));
    }

    private static async Task EnqueueCoreAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid outboxId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.AuthorityPipelineWorkOutbox
                           (OutboxId, RunId, TenantId, WorkspaceId, ProjectId, PayloadJson, CreatedUtc)
                           VALUES (@OutboxId, @RunId, @TenantId, @WorkspaceId, @ProjectId, @PayloadJson, SYSUTCDATETIME());
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
                    ProjectId = projectId,
                    PayloadJson = payloadJson
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
