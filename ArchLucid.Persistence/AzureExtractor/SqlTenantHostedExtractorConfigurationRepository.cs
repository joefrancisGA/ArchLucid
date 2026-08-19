using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.AzureExtractor;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed class SqlTenantHostedExtractorConfigurationRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantHostedExtractorConfigurationRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantHostedExtractorConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(tenantId, subscriptionId, ct),
            cancellationToken);

    public Task UpsertAsync(TenantHostedExtractorConfigurationRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    public Task<IReadOnlyList<TenantHostedExtractorConfigurationRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => ListByTenantCoreAsync(tenantId, ct),
            cancellationToken);

    private async Task<TenantHostedExtractorConfigurationRecord?> TryGetCoreAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        string normalizedSubscriptionId = NormalizeSubscriptionId(subscriptionId);

        const string sql = """
                             SELECT TenantId,
                                    SubscriptionId,
                                    CustomerTenantId,
                                    CustomerAppId,
                                    IncludeCost,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantHostedExtractorConfigurations
                             WHERE TenantId = @TenantId
                               AND SubscriptionId = @SubscriptionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, SubscriptionId = normalizedSubscriptionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task<IReadOnlyList<TenantHostedExtractorConfigurationRecord>> ListByTenantCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                             SELECT TenantId,
                                    SubscriptionId,
                                    CustomerTenantId,
                                    CustomerAppId,
                                    IncludeCost,
                                    UpdatedUtc,
                                    UpdatedByActorId
                             FROM dbo.TenantHostedExtractorConfigurations
                             WHERE TenantId = @TenantId
                             ORDER BY UpdatedUtc DESC;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(row => row.ToRecord()).ToList();
    }

    private async Task UpsertCoreAsync(
        TenantHostedExtractorConfigurationRecord record,
        CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.CustomerTenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.CustomerAppId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.SubscriptionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        string normalizedSubscriptionId = NormalizeSubscriptionId(record.SubscriptionId);

        const string sql = """
                             MERGE dbo.TenantHostedExtractorConfigurations AS target
                             USING (SELECT @TenantId AS TenantId, @SubscriptionId AS SubscriptionId) AS source
                             ON target.TenantId = source.TenantId
                               AND target.SubscriptionId = source.SubscriptionId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     CustomerTenantId = @CustomerTenantId,
                                     CustomerAppId = @CustomerAppId,
                                     IncludeCost = @IncludeCost,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (TenantId, SubscriptionId, CustomerTenantId, CustomerAppId, IncludeCost,
                                         UpdatedUtc, UpdatedByActorId)
                                 VALUES (@TenantId, @SubscriptionId, @CustomerTenantId, @CustomerAppId, @IncludeCost,
                                         SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        record.TenantId,
                        SubscriptionId = normalizedSubscriptionId,
                        CustomerTenantId = record.CustomerTenantId.Trim(),
                        CustomerAppId = record.CustomerAppId.Trim(),
                        record.IncludeCost,
                        record.UpdatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private static string NormalizeSubscriptionId(string subscriptionId) =>
        subscriptionId.Trim().ToLowerInvariant();

    private sealed class Row
    {
        public Guid TenantId { get; init; }

        public string SubscriptionId { get; init; } = string.Empty;

        public string CustomerTenantId { get; init; } = string.Empty;

        public string CustomerAppId { get; init; } = string.Empty;

        public bool IncludeCost { get; init; }

        public DateTimeOffset UpdatedUtc { get; init; }

        public string UpdatedByActorId { get; init; } = string.Empty;

        public TenantHostedExtractorConfigurationRecord ToRecord() =>
            new()
            {
                TenantId = TenantId,
                SubscriptionId = SubscriptionId,
                CustomerTenantId = CustomerTenantId,
                CustomerAppId = CustomerAppId,
                IncludeCost = IncludeCost,
                UpdatedUtc = UpdatedUtc,
                UpdatedByActorId = UpdatedByActorId
            };
    }
}
