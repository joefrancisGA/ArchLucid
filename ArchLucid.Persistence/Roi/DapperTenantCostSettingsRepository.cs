using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Roi;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperTenantCostSettingsRepository(ISqlConnectionFactory connectionFactory) : ITenantCostSettingsRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<TenantCostSettingsRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, ArchitectHourlyRateUsd, AverageIncidentCostUsd, EaDiscountMultiplier, UpdatedUtc, UpdatedByActorId
                           FROM dbo.TenantCostSettings
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CostSettingsRow? row = await connection.QuerySingleOrDefaultAsync<CostSettingsRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        if (row is null)
            return null;

        return row.ToRecord();
    }

    public async Task UpsertAsync(TenantCostSettingsRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           MERGE dbo.TenantCostSettings AS target
                           USING (SELECT @TenantId AS TenantId) AS source
                           ON target.TenantId = source.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET
                                   ArchitectHourlyRateUsd = @ArchitectHourlyRateUsd,
                                   AverageIncidentCostUsd = @AverageIncidentCostUsd,
                                   EaDiscountMultiplier = @EaDiscountMultiplier,
                                   UpdatedUtc = SYSUTCDATETIME(),
                                   UpdatedByActorId = @UpdatedByActorId
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, ArchitectHourlyRateUsd, AverageIncidentCostUsd, EaDiscountMultiplier, UpdatedByActorId)
                               VALUES (@TenantId, @ArchitectHourlyRateUsd, @AverageIncidentCostUsd, @EaDiscountMultiplier, @UpdatedByActorId);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.TenantId,
                    record.ArchitectHourlyRateUsd,
                    record.AverageIncidentCostUsd,
                    record.EaDiscountMultiplier,
                    record.UpdatedByActorId,
                },
                cancellationToken: cancellationToken));
    }

    private sealed class CostSettingsRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public decimal ArchitectHourlyRateUsd
        {
            get;
            init;
        }

        public decimal AverageIncidentCostUsd
        {
            get;
            init;
        }

        public decimal EaDiscountMultiplier
        {
            get;
            init;
        } = 1.0m;

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public string? UpdatedByActorId
        {
            get;
            init;
        }

        public TenantCostSettingsRecord ToRecord()
        {
            return new TenantCostSettingsRecord
            {
                TenantId = TenantId,
                ArchitectHourlyRateUsd = ArchitectHourlyRateUsd,
                AverageIncidentCostUsd = AverageIncidentCostUsd,
                EaDiscountMultiplier = EaDiscountMultiplier <= 0m ? 1.0m : EaDiscountMultiplier,
                UpdatedUtc = new DateTimeOffset(DateTime.SpecifyKind(UpdatedUtc, DateTimeKind.Utc)),
                UpdatedByActorId = UpdatedByActorId,
            };
        }
    }
}
