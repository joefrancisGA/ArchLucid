using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.AzureExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed class SqlTenantCloudConnectionRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantCloudConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantCloudConnectionRecord?> TryGetAsync(
        Guid connectionId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(connectionId, ct),
            cancellationToken);

    public Task<IReadOnlyList<TenantCloudConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => ListByTenantCoreAsync(tenantId, ct),
            cancellationToken);

    public Task UpsertAsync(TenantCloudConnectionRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    private async Task<TenantCloudConnectionRecord?> TryGetCoreAsync(
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    TenantIdAzure,
                                    ClientId,
                                    SubscriptionIds,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantCloudConnections
                             WHERE ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<IReadOnlyList<TenantCloudConnectionRecord>> ListByTenantCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                             SELECT ConnectionId,
                                    TenantId,
                                    TenantIdAzure,
                                    ClientId,
                                    SubscriptionIds,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantCloudConnections
                             WHERE TenantId = @TenantId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(r => r.ToRecord()).ToList();
    }

    private async Task UpsertCoreAsync(
        TenantCloudConnectionRecord record,
        CancellationToken cancellationToken)
    {
        if (record.ConnectionId == Guid.Empty)
            throw new ArgumentException("ConnectionId is required.", nameof(record));
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.TenantIdAzure);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.ClientId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.SubscriptionIds);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        const string sql = """
                             MERGE dbo.TenantCloudConnections AS target
                             USING (SELECT @ConnectionId AS ConnectionId) AS source
                             ON target.ConnectionId = source.ConnectionId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     TenantIdAzure = @TenantIdAzure,
                                     ClientId = @ClientId,
                                     SubscriptionIds = @SubscriptionIds,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (ConnectionId, TenantId, TenantIdAzure, ClientId, SubscriptionIds,
                                         UpdatedUtc, UpdatedByActorId)
                                 VALUES (@ConnectionId, @TenantId, @TenantIdAzure, @ClientId, @SubscriptionIds,
                                         SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        record.ConnectionId,
                        record.TenantId,
                        TenantIdAzure = record.TenantIdAzure.Trim(),
                        ClientId = record.ClientId.Trim(),
                        SubscriptionIds = record.SubscriptionIds.Trim(),
                        record.UpdatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private sealed class Row
    {
        public Guid ConnectionId { get; init; }

        public Guid TenantId { get; init; }

        public string TenantIdAzure { get; init; } = string.Empty;

        public string ClientId { get; init; } = string.Empty;

        public string SubscriptionIds { get; init; } = string.Empty;

        public DateTimeOffset UpdatedUtc { get; init; }

        public string UpdatedByActorId { get; init; } = string.Empty;

        public TenantCloudConnectionRecord ToRecord() =>
            new()
            {
                ConnectionId = ConnectionId,
                TenantId = TenantId,
                TenantIdAzure = TenantIdAzure,
                ClientId = ClientId,
                SubscriptionIds = SubscriptionIds,
                UpdatedUtc = UpdatedUtc,
                UpdatedByActorId = UpdatedByActorId
            };
    }
}
