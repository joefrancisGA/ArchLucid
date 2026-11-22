using System.Data;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL aggregation for findings opened/resolved audit buckets (tenant-scoped).</summary>
public sealed class DapperComplianceDriftFindingsTrendReader(IReadOnlyDbConnectionFactory readConnectionFactory)
    : IComplianceDriftFindingsTrendReader
{
    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>> GetBucketCountsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
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

        // DATEADD's offset argument is a 32-bit int (SQL Server hard limit for every datepart, including
        // NANOSECOND). A NANOSECOND-scale offset over a realistic trend window (days/weeks) overflows that
        // int and SQL Server throws "Arithmetic overflow error converting expression to data type int" —
        // surfaced to callers as a 503 via ApplicationProblemMapper.TryMapDatabaseException. SECOND-scale
        // offsets stay within int32 for date ranges up to ~68 years, and bucketMinutes (the only current
        // caller, GovernanceController) is always a whole number of minutes, so second precision loses
        // nothing when using completed seconds. DATEDIFF_BIG counts wall-clock boundaries, so subtract
        // the early crossing when the event's fractional second precedes the origin's fraction.

        if (bucketSize.Ticks % TimeSpan.TicksPerSecond != 0)
            throw new ArgumentException("Bucket size must be a whole number of seconds.", nameof(bucketSize));

        long bucketSeconds = bucketSize.Ticks / TimeSpan.TicksPerSecond;

        const string sql = """
                           SELECT
                               bucket.BucketUtc,
                               SUM(CASE WHEN EventType IN @OpenedTypes THEN 1 ELSE 0 END) AS OpenFindingsCount,
                               SUM(CASE WHEN EventType IN @ResolvedTypes THEN 1 ELSE 0 END) AS ResolvedFindingsCount
                           FROM dbo.AuditEvents
                           CROSS APPLY (VALUES (DATEADD(
                               SECOND,
                               ((DATEDIFF_BIG(SECOND, @FromUtc, OccurredUtc)
                                   - CASE WHEN DATEPART(NANOSECOND, OccurredUtc) < DATEPART(NANOSECOND, @FromUtc)
                                          THEN 1 ELSE 0 END) / @BucketSeconds) * @BucketSeconds,
                               @FromUtc))) AS bucket(BucketUtc)
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND OccurredUtc >= @FromUtc
                             AND OccurredUtc < @ToUtc
                             AND EventType IN @AllTypes
                           GROUP BY bucket.BucketUtc;
                           """;

        string[] allTypes = ComplianceDriftFindingsTrendAuditTypes.Opened
            .Concat(ComplianceDriftFindingsTrendAuditTypes.Resolved)
            .ToArray();
        DynamicParameters parameters = new(new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            BucketSeconds = bucketSeconds,
            OpenedTypes = ComplianceDriftFindingsTrendAuditTypes.Opened,
            ResolvedTypes = ComplianceDriftFindingsTrendAuditTypes.Resolved,
            AllTypes = allTypes,
        });
        parameters.Add("FromUtc", fromUtc, DbType.DateTime2, scale: 7);
        parameters.Add("ToUtc", toUtc, DbType.DateTime2, scale: 7);

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<BucketRow> rows = await connection.QueryAsync<BucketRow>(
            new CommandDefinition(
                sql,
                parameters,
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
