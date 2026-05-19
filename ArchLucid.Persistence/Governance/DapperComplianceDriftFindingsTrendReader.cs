using ArchLucid.Application.Governance;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL aggregation for findings opened/resolved audit buckets (tenant-scoped).</summary>
public sealed class DapperComplianceDriftFindingsTrendReader(ISqlConnectionFactory connectionFactory)
    : IComplianceDriftFindingsTrendReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>> GetBucketCountsAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (fromUtc >= toUtc)
            throw new ArgumentOutOfRangeException(nameof(toUtc));

        if (bucketSize <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(bucketSize));

        long bucketTicks = bucketSize.Ticks;

        const string sql = """
                           SELECT
                               DATEADD(
                                   NANOSECOND,
                                   (DATEDIFF_BIG(NANOSECOND, @FromUtc, OccurredUtc) / @BucketTicks) * @BucketTicks,
                                   @FromUtc) AS BucketUtc,
                               SUM(CASE WHEN EventType IN @OpenedTypes THEN 1 ELSE 0 END) AS OpenFindingsCount,
                               SUM(CASE WHEN EventType IN @ResolvedTypes THEN 1 ELSE 0 END) AS ResolvedFindingsCount
                           FROM dbo.AuditEvents
                           WHERE TenantId = @TenantId
                             AND OccurredUtc >= @FromUtc
                             AND OccurredUtc < @ToUtc
                             AND EventType IN @AllTypes
                           GROUP BY DATEADD(
                               NANOSECOND,
                               (DATEDIFF_BIG(NANOSECOND, @FromUtc, OccurredUtc) / @BucketTicks) * @BucketTicks,
                               @FromUtc);
                           """;

        string[] allTypes = ComplianceDriftFindingsTrendAuditTypes.Opened
            .Concat(ComplianceDriftFindingsTrendAuditTypes.Resolved)
            .ToArray();

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<BucketRow> rows = await connection.QueryAsync<BucketRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    FromUtc = fromUtc,
                    ToUtc = toUtc,
                    BucketTicks = bucketTicks,
                    OpenedTypes = ComplianceDriftFindingsTrendAuditTypes.Opened,
                    ResolvedTypes = ComplianceDriftFindingsTrendAuditTypes.Resolved,
                    AllTypes = allTypes,
                },
                cancellationToken: cancellationToken));

        Dictionary<DateTime, ComplianceDriftFindingsBucketCounts> map = new();

        foreach (BucketRow row in rows)
        {
            map[row.BucketUtc] = new ComplianceDriftFindingsBucketCounts
            {
                OpenFindingsCount = row.OpenFindingsCount,
                ResolvedFindingsCount = row.ResolvedFindingsCount,
            };
        }

        return map;
    }

    private sealed class BucketRow
    {
        public DateTime BucketUtc
        {
            get;
            init;
        }

        public int OpenFindingsCount
        {
            get;
            init;
        }

        public int ResolvedFindingsCount
        {
            get;
            init;
        }
    }
}
