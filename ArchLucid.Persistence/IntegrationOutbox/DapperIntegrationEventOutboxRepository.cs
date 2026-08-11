using System.Data;
using ArchLucid.Core.Tenancy;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Integration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Dapper implementation over <c>dbo.IntegrationEventOutbox</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.")]
public sealed class DapperIntegrationEventOutboxRepository(ISqlConnectionFactory connectionFactory)
    : IIntegrationEventOutboxRepository
{
    /// <inheritdoc />
    public async Task EnqueueAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
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
            eventType,
            messageId,
            payloadUtf8,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
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
            eventType,
            messageId,
            payloadUtf8,
            tenantId,
            workspaceId,
            projectId,
            ct);
    }

    private static async Task EnqueueCoreAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid outboxId,
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        byte[] bytes = payloadUtf8.ToArray();

        int priority = IntegrationEventOutboxPriority.ForEventType(eventType);


        await connection.ExecuteAsync(
            new CommandDefinition(
                IntegrationEventOutboxSql.Enqueue,
                new
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    EventType = eventType,
                    MessageId = messageId,
                    PayloadUtf8 = bytes,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Priority = priority,
                },
                transaction: transaction,
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<IntegrationEventOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct)
    {
        int take = Math.Clamp(maxBatch, 1, 100);


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<IntegrationEventOutboxRow> rows = await connection.QueryAsync<IntegrationEventOutboxRow>(
            new CommandDefinition(IntegrationEventOutboxSql.DequeuePending, new
            {
                Take = take
            }, cancellationToken: ct));

        List<IntegrationEventOutboxEntry> list = [];

        foreach (IntegrationEventOutboxRow row in rows)
        {
            if (row.PayloadUtf8 is null || row.EventType is null)
                continue;


            list.Add(
                new IntegrationEventOutboxEntry
                {
                    OutboxId = row.OutboxId,
                    RunId = row.RunId,
                    EventType = row.EventType,
                    MessageId = row.MessageId,
                    PayloadUtf8 = row.PayloadUtf8,
                    TenantId = row.TenantId,
                    WorkspaceId = row.WorkspaceId,
                    ProjectId = row.ProjectId,
                    CreatedUtc = row.CreatedUtc,
                    Priority = row.Priority,
                    RetryCount = row.RetryCount,
                    NextRetryUtc = row.NextRetryUtc,
                    LastErrorMessage = row.LastErrorMessage,
                    DeadLetteredUtc = row.DeadLetteredUtc
                });
        }

        return list;
    }

    /// <inheritdoc />
    public async Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(new CommandDefinition(IntegrationEventOutboxSql.MarkProcessed, new
        {
            OutboxId = outboxId
        }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task RecordPublishFailureAsync(
        Guid outboxId,
        int newRetryCount,
        DateTime? nextRetryUtc,
        DateTime? deadLetteredUtc,
        string? lastErrorMessage,
        CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                IntegrationEventOutboxSql.RecordPublishFailure,
                new
                {
                    OutboxId = outboxId,
                    NewRetryCount = newRetryCount,
                    NextRetryUtc = nextRetryUtc,
                    DeadLetteredUtc = deadLetteredUtc,
                    LastErrorMessage = TruncateError(lastErrorMessage)
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<long> CountIntegrationOutboxPublishPendingAsync(CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        long count = await connection.QuerySingleAsync<long>(new CommandDefinition(IntegrationEventOutboxSql.CountPublishPending, cancellationToken: ct));

        return count;
    }

    /// <inheritdoc />
    public async Task<long> CountIntegrationOutboxDeadLetterAsync(CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        long count = await connection.QuerySingleAsync<long>(new CommandDefinition(IntegrationEventOutboxSql.CountDeadLetter, cancellationToken: ct));

        return count;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListDeadLettersAsync(int maxRows, CancellationToken ct)
    {
        int take = Math.Clamp(maxRows, 1, 500);


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<DeadLetterRow> rows = await connection.QueryAsync<DeadLetterRow>(
            new CommandDefinition(IntegrationEventOutboxSql.ListDeadLetters, new
            {
                Take = take
            }, cancellationToken: ct));

        List<IntegrationEventOutboxDeadLetterRow> list = [];

        foreach (DeadLetterRow row in rows)
        {
            if (row.EventType is null)
                continue;


            list.Add(
                new IntegrationEventOutboxDeadLetterRow
                {
                    OutboxId = row.OutboxId,
                    RunId = row.RunId,
                    TenantId = row.TenantId,
                    EventType = row.EventType,
                    DeadLetteredUtc = row.DeadLetteredUtc,
                    RetryCount = row.RetryCount,
                    LastErrorMessage = row.LastErrorMessage
                });
        }

        return list;
    }

    /// <inheritdoc />
    public async Task<bool> ResetDeadLetterForRetryAsync(Guid outboxId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int rows = await connection.ExecuteAsync(new CommandDefinition(IntegrationEventOutboxSql.ResetDeadLetterForRetry, new
        {
            OutboxId = outboxId
        }, cancellationToken: ct));

        return rows > 0;
    }

    /// <inheritdoc />
    public async Task<bool> AcknowledgeDeadLetterAsync(Guid outboxId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int rows = await connection.ExecuteAsync(new CommandDefinition(IntegrationEventOutboxSql.AcknowledgeDeadLetter, new
        {
            OutboxId = outboxId
        }, cancellationToken: ct));

        return rows > 0;
    }

    /// <inheritdoc />
    public async Task<IntegrationOutboxDeadLetterBulkRetryResult> RetryMatchingDeadLettersAsync(
        Guid? tenantId,
        string? eventType,
        int maxRows,
        CancellationToken ct)
    {
        int take = Math.Clamp(maxRows, 1, 500);
        string? normalizedEventType = string.IsNullOrWhiteSpace(eventType) ? null : eventType.Trim();


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<Guid> candidateIds = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                IntegrationEventOutboxSql.SelectMatchingDeadLetterIds,
                new
                {
                    Take = take,
                    TenantId = tenantId,
                    EventType = normalizedEventType
                },
                cancellationToken: ct));

        List<Guid> ids = candidateIds.ToList();

        if (ids.Count == 0)
        {
            return new IntegrationOutboxDeadLetterBulkRetryResult
            {
                RetriedCount = 0,
                RetriedOutboxIds = []
            };
        }


        IEnumerable<Guid> retried = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                IntegrationEventOutboxSql.BulkResetDeadLetters,
                new { OutboxIds = ids },
                cancellationToken: ct));

        List<Guid> retriedList = retried.ToList();

        return new IntegrationOutboxDeadLetterBulkRetryResult
        {
            RetriedCount = retriedList.Count,
            RetriedOutboxIds = retriedList
        };
    }

    /// <inheritdoc />
    public async Task<IntegrationEventOutboxEntry?> TryGetDeadLetterEntryAsync(Guid outboxId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IntegrationEventOutboxRow? row = await connection.QuerySingleOrDefaultAsync<IntegrationEventOutboxRow>(
            new CommandDefinition(IntegrationEventOutboxSql.TryGetDeadLetterEntry, new { OutboxId = outboxId }, cancellationToken: ct));

        if (row?.EventType is null || row.PayloadUtf8 is null)
            return null;

        return new IntegrationEventOutboxEntry
        {
            OutboxId = row.OutboxId,
            RunId = row.RunId,
            EventType = row.EventType,
            MessageId = row.MessageId,
            PayloadUtf8 = row.PayloadUtf8,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            CreatedUtc = row.CreatedUtc,
            Priority = row.Priority,
            RetryCount = row.RetryCount,
            NextRetryUtc = row.NextRetryUtc,
            LastErrorMessage = row.LastErrorMessage,
            DeadLetteredUtc = row.DeadLetteredUtc,
        };
    }

    private static string? TruncateError(string? message)
    {
        if (message is null)
            return null;


        const int maxLen = 2048;

        return message.Length <= maxLen ? message : message[..maxLen];
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper materialization.")]
    private sealed class IntegrationEventOutboxRow
    {
        public Guid OutboxId
        {
            get; init;
        }

        public Guid? RunId
        {
            get; init;
        }

        public string? EventType
        {
            get; init;
        }

        public string? MessageId
        {
            get; init;
        }

        public byte[]? PayloadUtf8
        {
            get; init;
        }

        public Guid TenantId
        {
            get; init;
        }

        public Guid WorkspaceId
        {
            get; init;
        }

        public Guid ProjectId
        {
            get; init;
        }

        public DateTime CreatedUtc
        {
            get; init;
        }

        public int? Priority
        {
            get; init;
        }

        public int RetryCount
        {
            get; init;
        }

        public DateTime? NextRetryUtc
        {
            get; init;
        }

        public string? LastErrorMessage
        {
            get; init;
        }

        public DateTime? DeadLetteredUtc
        {
            get; init;
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper materialization.")]
    private sealed class DeadLetterRow
    {
        public Guid OutboxId
        {
            get; init;
        }

        public Guid? RunId
        {
            get; init;
        }

        public Guid TenantId
        {
            get; init;
        }

        public string? EventType
        {
            get; init;
        }

        public DateTime DeadLetteredUtc
        {
            get; init;
        }

        public int RetryCount
        {
            get; init;
        }

        public string? LastErrorMessage
        {
            get; init;
        }
    }
}
