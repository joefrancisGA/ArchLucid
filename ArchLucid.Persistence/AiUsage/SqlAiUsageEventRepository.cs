using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AiUsage;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.AiUsage;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlAiUsageEventRepository(IDbConnectionFactory connectionFactory) : IAiUsageEventRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task InsertAsync(AiUsageEventRecord record, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
            INSERT INTO dbo.AiUsageEvents
            (
                Id, TenantId, UserId, Feature, ProviderKind,
                InputTokens, OutputTokens, EstimatedCostUsd, ActualCostUsd,
                OccurredUtc, CorrelationId, ServedFromDemoCache, BudgetBlocked
            )
            VALUES
            (
                @Id, @TenantId, @UserId, @Feature, @ProviderKind,
                @InputTokens, @OutputTokens, @EstimatedCostUsd, @ActualCostUsd,
                @OccurredUtc, @CorrelationId, @ServedFromDemoCache, @BudgetBlocked
            )
            """;

        await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        record.Id,
                        record.TenantId,
                        record.UserId,
                        Feature = record.Feature.ToString(),
                        record.ProviderKind,
                        record.InputTokens,
                        record.OutputTokens,
                        record.EstimatedCostUsd,
                        record.ActualCostUsd,
                        record.OccurredUtc,
                        record.CorrelationId,
                        record.ServedFromDemoCache,
                        record.BudgetBlocked,
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiUsageEventRecord>> ListRecentForTenantAsync(
        Guid tenantId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
            SELECT TOP (@Limit)
                Id, TenantId, UserId, Feature, ProviderKind,
                InputTokens, OutputTokens, EstimatedCostUsd, ActualCostUsd,
                OccurredUtc, CorrelationId, ServedFromDemoCache, BudgetBlocked
            FROM dbo.AiUsageEvents
            WHERE TenantId = @TenantId
            ORDER BY OccurredUtc DESC
            """;

        IEnumerable<AiUsageEventRow> rows = await connection
            .QueryAsync<AiUsageEventRow>(
                new CommandDefinition(sql, new { TenantId = tenantId, Limit = Math.Max(1, limit) }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.Select(MapRow).ToList();
    }

    public async Task<IReadOnlyDictionary<AiUsageFeature, decimal>> SumEstimatedCostByFeatureAsync(
        Guid tenantId,
        DateTimeOffset fromUtc,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
            SELECT Feature, SUM(EstimatedCostUsd) AS TotalUsd
            FROM dbo.AiUsageEvents
            WHERE TenantId = @TenantId
              AND OccurredUtc >= @FromUtc
              AND BudgetBlocked = 0
              AND ServedFromDemoCache = 0
            GROUP BY Feature
            """;

        IEnumerable<FeatureCostRow> rows = await connection
            .QueryAsync<FeatureCostRow>(
                new CommandDefinition(sql, new { TenantId = tenantId, FromUtc = fromUtc }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows.ToDictionary(r => Enum.Parse<AiUsageFeature>(r.Feature), r => r.TotalUsd);
    }

    private static AiUsageEventRecord MapRow(AiUsageEventRow row) =>
        new()
        {
            Id = row.Id,
            TenantId = row.TenantId,
            UserId = row.UserId,
            Feature = Enum.Parse<AiUsageFeature>(row.Feature),
            ProviderKind = row.ProviderKind,
            InputTokens = row.InputTokens,
            OutputTokens = row.OutputTokens,
            EstimatedCostUsd = row.EstimatedCostUsd,
            ActualCostUsd = row.ActualCostUsd,
            OccurredUtc = row.OccurredUtc,
            CorrelationId = row.CorrelationId,
            ServedFromDemoCache = row.ServedFromDemoCache,
            BudgetBlocked = row.BudgetBlocked,
        };

    private sealed class AiUsageEventRow
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

        public string? UserId
        {
            get;
            init;
        }

        public string Feature
        {
            get;
            init;
        } = string.Empty;

        public string ProviderKind
        {
            get;
            init;
        } = string.Empty;

        public int InputTokens
        {
            get;
            init;
        }

        public int OutputTokens
        {
            get;
            init;
        }

        public decimal EstimatedCostUsd
        {
            get;
            init;
        }

        public decimal? ActualCostUsd
        {
            get;
            init;
        }

        public DateTimeOffset OccurredUtc
        {
            get;
            init;
        }

        public string? CorrelationId
        {
            get;
            init;
        }

        public bool ServedFromDemoCache
        {
            get;
            init;
        }

        public bool BudgetBlocked
        {
            get;
            init;
        }
    }

    private sealed class FeatureCostRow
    {
        public string Feature
        {
            get;
            init;
        } = string.Empty;

        public decimal TotalUsd
        {
            get;
            init;
        }
    }
}
