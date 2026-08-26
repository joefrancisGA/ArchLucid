using ArchLucid.Core.Integration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.IntegrationOutbox;

public sealed partial class DapperIntegrationEventOutboxRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListDeadLettersAsync(
        int maxRows,
        Guid? tenantId,
        int skip,
        CancellationToken ct)
    {
        int take = Math.Clamp(maxRows, 1, 500);
        int offset = Math.Max(0, skip);


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<DeadLetterRow> rows = await connection.QueryAsync<DeadLetterRow>(
            new CommandDefinition(IntegrationEventOutboxSql.ListDeadLetters, new
            {
                Take = take,
                TenantId = tenantId,
                Skip = offset
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
    public async Task<bool> ResetDeadLetterForRetryAsync(Guid outboxId, Guid? tenantId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int rows = await connection.ExecuteAsync(new CommandDefinition(IntegrationEventOutboxSql.ResetDeadLetterForRetry, new
        {
            OutboxId = outboxId,
            TenantId = tenantId
        }, cancellationToken: ct));

        return rows > 0;
    }

    /// <inheritdoc />
    public async Task<bool> AcknowledgeDeadLetterAsync(Guid outboxId, Guid? tenantId, CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int rows = await connection.ExecuteAsync(new CommandDefinition(IntegrationEventOutboxSql.AcknowledgeDeadLetter, new
        {
            OutboxId = outboxId,
            TenantId = tenantId
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
    public async Task<IntegrationEventOutboxEntry?> TryGetDeadLetterEntryAsync(
        Guid outboxId,
        Guid? tenantId,
        CancellationToken ct)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IntegrationEventOutboxRow? row = await connection.QuerySingleOrDefaultAsync<IntegrationEventOutboxRow>(
            new CommandDefinition(
                IntegrationEventOutboxSql.TryGetDeadLetterEntry,
                new { OutboxId = outboxId, TenantId = tenantId },
                cancellationToken: ct));

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
}
