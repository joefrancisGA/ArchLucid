using ArchLucid.Core.Notifications;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Notifications;

/// <summary>SQL idempotency ledger for transactional email (<c>dbo.SentEmails</c>).</summary>
public sealed class DapperSentEmailLedger(ISqlConnectionFactory connectionFactory) : ISentEmailLedger
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<bool> IsRecordedAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return false;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT CASE
                               WHEN EXISTS (
                                   SELECT 1
                                   FROM dbo.SentEmails e
                                   WHERE e.IdempotencyKey = @IdempotencyKey
                                     AND e.TenantId = @TenantId)
                               THEN 1
                               ELSE 0
                           END;
                           """;

        int exists = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new { IdempotencyKey = idempotencyKey.Trim(), TenantId = tenantId },
                cancellationToken: cancellationToken));

        return exists == 1;
    }

    /// <inheritdoc />
    public async Task<bool> TryRecordSentAsync(SentEmailLedgerEntry entry, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           INSERT INTO dbo.SentEmails (IdempotencyKey, TenantId, TemplateId, Provider, ProviderMessageId)
                           SELECT @IdempotencyKey, @TenantId, @TemplateId, @Provider, @ProviderMessageId
                           WHERE NOT EXISTS (
                               SELECT 1
                               FROM dbo.SentEmails e WITH (UPDLOCK, HOLDLOCK)
                               WHERE e.IdempotencyKey = @IdempotencyKey);

                           SELECT @@ROWCOUNT;
                           """;

        int inserted = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    entry.IdempotencyKey,
                    entry.TenantId,
                    entry.TemplateId,
                    entry.Provider,
                    entry.ProviderMessageId
                },
                cancellationToken: cancellationToken));

        return inserted == 1;
    }
}
