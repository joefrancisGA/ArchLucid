using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.AwsExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via unit/API tests with in-memory repo.")]
public sealed class SqlTenantAwsConnectionRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantAwsConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantAwsConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(tenantId, connectionId, ct),
            cancellationToken);

    public Task<TenantAwsConnectionRecord?> TryGetByAccountAsync(
        Guid tenantId,
        string accountId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetByAccountCoreAsync(tenantId, accountId, ct),
            cancellationToken);

    public Task UpsertAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        AwsConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => UpdateStatusCoreAsync(tenantId, connectionId, status, lastPolledUtc, updatedByActorId, ct),
            cancellationToken);

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => DeleteCoreAsync(tenantId, connectionId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListByTenantCoreAsync(tenantId, ct), cancellationToken);

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListActiveConnectionsCoreAsync(ct), cancellationToken);

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

    private async Task UpsertCoreAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.AccountId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.Region);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.RoleArn);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        string normalizedAccountId = NormalizeAccountId(record.AccountId);
        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;

        const string sql = """
                             MERGE dbo.TenantAwsConnectionRecords AS target
                             USING (SELECT @TenantId AS TenantId, @AccountId AS AccountId) AS source
                             ON target.TenantId = source.TenantId
                               AND target.AccountId = source.AccountId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     Region = @Region,
                                     RoleArn = @RoleArn,
                                     Status = @Status,
                                     LastPolledUtc = @LastPolledUtc,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (ConnectionId, TenantId, AccountId, Region, RoleArn, Status,
                                         LastPolledUtc, CreatedUtc, UpdatedUtc, UpdatedByActorId)
                                 VALUES (@ConnectionId, @TenantId, @AccountId, @Region, @RoleArn, @Status,
                                         @LastPolledUtc, SYSUTCDATETIME(), SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        ConnectionId = connectionId,
                        record.TenantId,
                        AccountId = normalizedAccountId,
                        Region = record.Region.Trim(),
                        RoleArn = record.RoleArn.Trim(),
                        Status = record.Status.ToString(),
                        record.LastPolledUtc,
                        record.UpdatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task UpdateStatusCoreAsync(
        Guid tenantId,
        Guid connectionId,
        AwsConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        ArgumentException.ThrowIfNullOrWhiteSpace(updatedByActorId);

        const string sql = """
                             UPDATE dbo.TenantAwsConnectionRecords
                             SET Status = @Status,
                                 LastPolledUtc = COALESCE(@LastPolledUtc, LastPolledUtc),
                                 UpdatedUtc = SYSUTCDATETIME(),
                                 UpdatedByActorId = @UpdatedByActorId
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        ConnectionId = connectionId,
                        Status = status.ToString(),
                        LastPolledUtc = lastPolledUtc,
                        UpdatedByActorId = updatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task DeleteCoreAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             DELETE FROM dbo.TenantAwsConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
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
