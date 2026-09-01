using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.Tenancy;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.AwsExtractor;

public sealed partial class SqlTenantAwsConnectionRepository
{
    private async Task<TenantAwsConnectionRecord?> TryGetCoreAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    AccountId,
                                    Region,
                                    RoleArn,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantAwsConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<TenantAwsConnectionRecord?> TryGetByAccountCoreAsync(
        Guid tenantId,
        string accountId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        string normalizedAccountId = NormalizeAccountId(accountId);

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    AccountId,
                                    Region,
                                    RoleArn,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantAwsConnectionRecords
                             WHERE TenantId = @TenantId
                               AND AccountId = @AccountId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, AccountId = normalizedAccountId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<IReadOnlyList<TenantAwsConnectionRecord>> ListByTenantCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    AccountId,
                                    Region,
                                    RoleArn,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantAwsConnectionRecords
                             WHERE TenantId = @TenantId
                             ORDER BY UpdatedUtc DESC;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(row => row.ToRecord()).ToList();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "ListActiveConnectionsAsync is a cross-tenant background-poller scan; it intentionally reads all active connections across all tenants and is invoked only by the hosted connection-health job identity.")]
    private async Task<IReadOnlyList<TenantAwsConnectionRecord>> ListActiveConnectionsCoreAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    AccountId,
                                    Region,
                                    RoleArn,
                                    Status,
                                    LastPolledUtc,
                                    CreatedUtc,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantAwsConnectionRecords
                             WHERE Status <> @Disconnected
                             ORDER BY UpdatedUtc DESC;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { Disconnected = AwsConnectionStatus.Disconnected.ToString() },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(row => row.ToRecord()).ToList();
    }

    private static string NormalizeAccountId(string accountId) =>
        accountId.Trim();

    private sealed class Row
    {
        public Guid ConnectionId { get; init; }

        public Guid TenantId { get; init; }

        public string AccountId { get; init; } = string.Empty;

        public string Region { get; init; } = string.Empty;

        public string RoleArn { get; init; } = string.Empty;

        public string Status { get; init; } = string.Empty;

        public DateTimeOffset? LastPolledUtc { get; init; }

        public DateTimeOffset CreatedUtc { get; init; }

        public DateTimeOffset UpdatedUtc { get; init; }

        public string UpdatedByActorId { get; init; } = string.Empty;

        public TenantAwsConnectionRecord ToRecord() =>
            new()
            {
                ConnectionId = ConnectionId,
                TenantId = TenantId,
                AccountId = AccountId,
                Region = Region,
                RoleArn = RoleArn,
                Status = Enum.TryParse<AwsConnectionStatus>(Status, out AwsConnectionStatus parsed)
                    ? parsed
                    : AwsConnectionStatus.Connected,
                LastPolledUtc = LastPolledUtc,
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc,
                UpdatedByActorId = UpdatedByActorId
            };
    }
}
