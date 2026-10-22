using ArchLucid.Core.Metering;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperUsageEventRepository
{
    public async Task<IReadOnlyList<TenantUsageSummary>> AggregateByKindAsync(
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           SELECT TenantId, Kind, SUM(Quantity) AS TotalQuantity, @PeriodStart AS PeriodStartUtc, @PeriodEnd AS PeriodEndUtc
                           FROM dbo.UsageEvents
                           WHERE TenantId = @TenantId
                             AND RecordedUtc >= @PeriodStart
                             AND RecordedUtc < @PeriodEnd
                           GROUP BY TenantId, Kind;
                           """;

        IEnumerable<SummaryRow> rows = await connection.QueryAsync<SummaryRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, PeriodStart = periodStart, PeriodEnd = periodEnd },
                cancellationToken: ct));

        return rows
            .Select(static r => new TenantUsageSummary
            {
                TenantId = r.TenantId,
                Kind = UsageMeterKindSql.ParseKind(r.Kind),
                TotalQuantity = r.TotalQuantity,
                PeriodStartUtc = r.PeriodStartUtc,
                PeriodEndUtc = r.PeriodEndUtc
            })
            .ToList();
    }

    public async Task<IReadOnlyList<UsageEvent>> ListAsync(
        Guid tenantId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        UsageMeterKind? kindFilter,
        int take,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        int effectiveTake = UsageEventRepositoryCore.ClampListTake(take);

        string sql = """
                     SELECT TOP (@Take) Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey
                     FROM dbo.UsageEvents
                     WHERE TenantId = @TenantId
                       AND RecordedUtc >= @PeriodStart
                       AND RecordedUtc < @PeriodEnd
                     """;

        object parameters;

        if (kindFilter.HasValue)
        {
            sql += " AND Kind = @Kind ";
            parameters = new
            {
                Take = effectiveTake,
                TenantId = tenantId,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                Kind = UsageMeterKindSql.ToKindString(kindFilter.Value)
            };
        }
        else

            parameters = new { Take = effectiveTake, TenantId = tenantId, PeriodStart = periodStart, PeriodEnd = periodEnd };

        sql += " ORDER BY RecordedUtc DESC;";

        IEnumerable<EventRow> rows = await connection.QueryAsync<EventRow>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));

        return rows.Select(static r => r.ToUsageEvent()).ToList();
    }

    private sealed class SummaryRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string Kind
        {
            get;
            init;
        } = string.Empty;

        public long TotalQuantity
        {
            get;
            init;
        }

        public DateTimeOffset PeriodStartUtc
        {
            get;
            init;
        }

        public DateTimeOffset PeriodEndUtc
        {
            get;
            init;
        }
    }

    private sealed class EventRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public string Kind
        {
            get;
            init;
        } = string.Empty;

        public long Quantity
        {
            get;
            init;
        }

        public DateTimeOffset RecordedUtc
        {
            get;
            init;
        }

        public string? CorrelationId
        {
            get;
            init;
        }

        public string? IdempotencyKey
        {
            get;
            init;
        }

        internal UsageEvent ToUsageEvent()
        {
            return new UsageEvent
            {
                Id = Id,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                Kind = UsageMeterKindSql.ParseKind(Kind),
                Quantity = Quantity,
                RecordedUtc = RecordedUtc,
                CorrelationId = CorrelationId,
                IdempotencyKey = IdempotencyKey
            };
        }
    }
}
