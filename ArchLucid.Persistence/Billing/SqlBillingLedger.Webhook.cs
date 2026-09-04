using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Billing;

public sealed partial class SqlBillingLedger
{
    public async Task<bool> TryInsertWebhookEventAsync(
        string dedupeKey,
        string provider,
        string eventType,
        string payloadJson,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    INSERT INTO dbo.BillingWebhookEvents (EventId, Provider, EventType, PayloadJson, ReceivedUtc, ProcessedUtc, ResultStatus)
                    VALUES (@EventId, @Provider, @EventType, @PayloadJson, SYSUTCDATETIME(), NULL, N'Received');
                    """,
                    new { EventId = dedupeKey, Provider = provider, EventType = eventType, PayloadJson = payloadJson },
                    cancellationToken: cancellationToken));

            return true;
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            return false;
        }
    }

    public async Task MarkWebhookProcessedAsync(string dedupeKey, string resultStatus,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                UPDATE dbo.BillingWebhookEvents
                SET ProcessedUtc = SYSUTCDATETIME(), ResultStatus = @ResultStatus
                WHERE EventId = @EventId;
                """,
                new { EventId = dedupeKey, ResultStatus = resultStatus },
                cancellationToken: cancellationToken));
    }

    public async Task<string?> GetWebhookEventResultStatusAsync(string dedupeKey, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<string?>(
            new CommandDefinition(
                """
                SELECT ResultStatus
                FROM dbo.BillingWebhookEvents
                WHERE EventId = @EventId;
                """,
                new { EventId = dedupeKey },
                cancellationToken: cancellationToken));
    }
}
