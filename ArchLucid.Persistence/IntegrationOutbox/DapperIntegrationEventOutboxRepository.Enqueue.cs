using System.Data;

using ArchLucid.Core.Integration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.IntegrationOutbox;

public sealed partial class DapperIntegrationEventOutboxRepository
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

    private static string? TruncateError(string? message)
    {
        if (message is null)
            return null;


        const int maxLen = 2048;

        return message.Length <= maxLen ? message : message[..maxLen];
    }
}
