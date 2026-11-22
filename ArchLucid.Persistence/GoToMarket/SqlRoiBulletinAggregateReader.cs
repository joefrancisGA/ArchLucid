using ArchLucid.Core.GoToMarket;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoToMarket;

/// <summary>Dapper implementation: tenant-supplied baseline hours only (non-null <c>BaselineReviewCycleHours</c>).</summary>
public sealed class SqlRoiBulletinAggregateReader(ISqlConnectionFactory connectionFactory) : IRoiBulletinAggregateReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<RoiBulletinAggregateReadResult> ReadAsync(
        RoiBulletinQuarterWindow window,
        int minimumTenantsRequired,
        CancellationToken cancellationToken = default)
    {
        if (minimumTenantsRequired < 0)
            throw new ArgumentOutOfRangeException(nameof(minimumTenantsRequired));

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string statsSql = """
                                SELECT TOP (1)
                                    COUNT(1) OVER () AS TenantCount,
                                    AVG(CAST(BaselineReviewCycleHours AS FLOAT)) OVER () AS MeanH,
                                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY BaselineReviewCycleHours) OVER () AS P50,
                                    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY BaselineReviewCycleHours) OVER () AS P90
                                FROM dbo.Tenants
                                WHERE BaselineReviewCycleHours IS NOT NULL
                                  AND BaselineReviewCycleCapturedUtc >= @Start
                                  AND BaselineReviewCycleCapturedUtc < @End;
                                """;

        StatsRow? row = await connection.QuerySingleOrDefaultAsync<StatsRow>(
            new CommandDefinition(
                statsSql,
                new { Start = window.StartUtcInclusive, End = window.EndUtcExclusive },
                cancellationToken: cancellationToken));

        int count = row?.TenantCount ?? 0;
        if (row is null || count < minimumTenantsRequired)
        {
            return new RoiBulletinAggregateReadResult(
                false,
                count,
                null,
                null,
                null,
                window.Label);
        }

        return new RoiBulletinAggregateReadResult(
            true,
            count,
            ToDecimal(row.MeanH),
            ToDecimal(row.P50),
            ToDecimal(row.P90),
            window.Label);
    }

    private static decimal? ToDecimal(double? value)
    {
        if (value is null || double.IsNaN(value.Value) || double.IsInfinity(value.Value))
            return null;

        return Convert.ToDecimal(value.Value);
    }

    private sealed class StatsRow
    {
        public int TenantCount { get; init; }

        public double? MeanH
        {
            get;
            init;
        }

        public double? P50
        {
            get;
            init;
        }

        public double? P90
        {
            get;
            init;
        }
    }
}
