using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;
using System.Text;

namespace ArchLucid.Persistence.Tenancy;

public sealed class DapperUsageEventRepository(ISqlConnectionFactory connectionFactory) : IUsageEventRepository
{
    private const string InsertSql = """
                                     INSERT INTO dbo.UsageEvents (Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                     SELECT @Id, @TenantId, @WorkspaceId, @ProjectId, @Kind, @Quantity, @RecordedUtc, @CorrelationId, @IdempotencyKey
                                     WHERE @IdempotencyKey IS NULL
                                        OR NOT EXISTS (
                                            SELECT 1
                                            FROM dbo.UsageEvents e WITH (UPDLOCK, HOLDLOCK)
                                            WHERE e.TenantId = @TenantId
                                              AND e.IdempotencyKey = @IdempotencyKey);
                                     """;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task InsertAsync(UsageEvent usageEvent, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                InsertSql,
                MapParameters(usageEvent),
                cancellationToken: ct));
    }

    public async Task InsertBatchAsync(IReadOnlyList<UsageEvent> events, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(events);

        if (events.Count == 0)
            return;

        List<UsageEvent> eventsToInsert = SelectDistinctIdempotencyKeysForBatchInsert(events);

        if (eventsToInsert.Count == 0)
            return;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction transaction = (SqlTransaction)await connection.BeginTransactionAsync(ct);

        const string insertHeader = """
                                    INSERT INTO dbo.UsageEvents (Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                    SELECT v.Id, v.TenantId, v.WorkspaceId, v.ProjectId, v.Kind, v.Quantity, v.RecordedUtc, v.CorrelationId, v.IdempotencyKey
                                    FROM (VALUES
                                    """;

        const string insertFooter = """
                                    ) AS v(Id, TenantId, WorkspaceId, ProjectId, Kind, Quantity, RecordedUtc, CorrelationId, IdempotencyKey)
                                    WHERE v.IdempotencyKey IS NULL
                                       OR NOT EXISTS (
                                           SELECT 1
                                           FROM dbo.UsageEvents e WITH (UPDLOCK, HOLDLOCK)
                                           WHERE e.TenantId = v.TenantId
                                             AND e.IdempotencyKey = v.IdempotencyKey);
                                    """;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction,
            eventsToInsert.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildUsageEventInsertChunk(insertHeader, insertFooter, eventsToInsert, offset, rowCount),
            ct).ConfigureAwait(false);

        await transaction.CommitAsync(ct);
    }

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
                Take = take,
                TenantId = tenantId,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                Kind = UsageMeterKindSql.ToKindString(kindFilter.Value)
            };
        }
        else

            parameters = new { Take = take, TenantId = tenantId, PeriodStart = periodStart, PeriodEnd = periodEnd };

        sql += " ORDER BY RecordedUtc DESC;";

        IEnumerable<EventRow> rows = await connection.QueryAsync<EventRow>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));

        return rows.Select(static r => r.ToUsageEvent()).ToList();
    }

    private static List<UsageEvent> SelectDistinctIdempotencyKeysForBatchInsert(IReadOnlyList<UsageEvent> events)
    {
        List<UsageEvent> selected = new(events.Count);
        HashSet<(Guid TenantId, string IdempotencyKey)> seenKeys = new();

        foreach (UsageEvent usageEvent in events)
        {
            if (!string.IsNullOrWhiteSpace(usageEvent.IdempotencyKey))
            {
                (Guid TenantId, string IdempotencyKey) key = (usageEvent.TenantId, usageEvent.IdempotencyKey);

                if (!seenKeys.Add(key))
                    continue;
            }

            selected.Add(usageEvent);
        }

        return selected;
    }

    private static object MapParameters(UsageEvent usageEvent) =>
        new
        {
            usageEvent.Id,
            usageEvent.TenantId,
            usageEvent.WorkspaceId,
            usageEvent.ProjectId,
            Kind = UsageMeterKindSql.ToKindString(usageEvent.Kind),
            usageEvent.Quantity,
            usageEvent.RecordedUtc,
            usageEvent.CorrelationId,
            usageEvent.IdempotencyKey
        };

    private static SqlChunkedBatchCommand BuildUsageEventInsertChunk(
        string insertHeader,
        string insertFooter,
        IReadOnlyList<UsageEvent> events,
        int offset,
        int rowCount)
    {
        StringBuilder commandText = new(insertHeader.Length + insertFooter.Length + rowCount * 100);
        commandText.Append(insertHeader);
        DynamicParameters parameters = new();

        for (int i = 0; i < rowCount; i++)
        {
            UsageEvent usageEvent = events[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append(
                $"(@Id{i},@TenantId{i},@WorkspaceId{i},@ProjectId{i},@Kind{i},@Quantity{i},@RecordedUtc{i},@CorrelationId{i},@IdempotencyKey{i})");

            parameters.Add($"Id{i}", usageEvent.Id);
            parameters.Add($"TenantId{i}", usageEvent.TenantId);
            parameters.Add($"WorkspaceId{i}", usageEvent.WorkspaceId);
            parameters.Add($"ProjectId{i}", usageEvent.ProjectId);
            parameters.Add($"Kind{i}", UsageMeterKindSql.ToKindString(usageEvent.Kind));
            parameters.Add($"Quantity{i}", usageEvent.Quantity);
            parameters.Add($"RecordedUtc{i}", usageEvent.RecordedUtc);
            parameters.Add($"CorrelationId{i}", usageEvent.CorrelationId);
            parameters.Add($"IdempotencyKey{i}", usageEvent.IdempotencyKey);
        }

        commandText.Append(insertFooter);
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
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
