using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Analytics;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Analytics;

[ExcludeFromCodeCoverage(Justification = "Azure SQL integration; validated via repository contract tests and operator endpoints.")]
public sealed class SqlInternalCrossTenantRollupRepository : IInternalCrossTenantRollupRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public SqlInternalCrossTenantRollupRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
    }

    /// <inheritdoc />
    public async Task UpsertDailyRowsAsync(
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows,
        CancellationToken cancellationToken = default)
    {
        if (rows.Count == 0)
            return;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           MERGE dbo.InternalCrossTenantRollupDaily AS target
                           USING (SELECT @RollupDate AS RollupDate,
                                         @AnalyticsTenantKey AS AnalyticsTenantKey,
                                         @TotalRunsNonArchived AS TotalRunsNonArchived,
                                         @TotalCompletedRuns AS TotalCompletedRuns,
                                         @SumCompletionSeconds AS SumCompletionSeconds,
                                         @EstimatedEngineeringHoursSaved AS EstimatedEngineeringHoursSaved,
                                         @LlmTokensUsed AS LlmTokensUsed,
                                         @ComputedUtc AS ComputedUtc) AS source
                           ON target.RollupDate = source.RollupDate
                               AND target.AnalyticsTenantKey = source.AnalyticsTenantKey
                           WHEN MATCHED THEN
                               UPDATE
                               SET TotalRunsNonArchived = source.TotalRunsNonArchived,
                                   TotalCompletedRuns = source.TotalCompletedRuns,
                                   SumCompletionSeconds = source.SumCompletionSeconds,
                                   EstimatedEngineeringHoursSaved = source.EstimatedEngineeringHoursSaved,
                                   LlmTokensUsed = source.LlmTokensUsed,
                                   ComputedUtc = source.ComputedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (RollupDate, AnalyticsTenantKey, TotalRunsNonArchived, TotalCompletedRuns,
                                       SumCompletionSeconds, EstimatedEngineeringHoursSaved, LlmTokensUsed, ComputedUtc)
                               VALUES (source.RollupDate, source.AnalyticsTenantKey, source.TotalRunsNonArchived,
                                       source.TotalCompletedRuns, source.SumCompletionSeconds,
                                       source.EstimatedEngineeringHoursSaved, source.LlmTokensUsed, source.ComputedUtc);
                           """;

        foreach (InternalCrossTenantRollupDailyRow row in rows)
        {
            double sumSeconds = 0;

            if (row.TotalCompletedRuns > 0 && row.AverageCompletedRunDurationSeconds.HasValue)
                sumSeconds = row.AverageCompletedRunDurationSeconds.Value * row.TotalCompletedRuns;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        RollupDate = row.RollupDate,
                        AnalyticsTenantKey = row.AnalyticsTenantKey,
                        row.TotalRunsNonArchived,
                        row.TotalCompletedRuns,
                        SumCompletionSeconds = sumSeconds,
                        row.EstimatedEngineeringHoursSaved,
                        row.LlmTokensUsed,
                        ComputedUtc = row.ComputedUtc.UtcDateTime,
                    },
                    cancellationToken: cancellationToken));
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> ListDailyRowsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT RollupDate,
                                  AnalyticsTenantKey,
                                  TotalRunsNonArchived,
                                  TotalCompletedRuns,
                                  CASE
                                      WHEN TotalCompletedRuns > 0
                                          THEN SumCompletionSeconds / CAST(TotalCompletedRuns AS FLOAT)
                                      ELSE NULL END AS AverageCompletedRunDurationSeconds,
                                  EstimatedEngineeringHoursSaved,
                                  LlmTokensUsed,
                                  ComputedUtc
                           FROM dbo.InternalCrossTenantRollupDaily
                           WHERE RollupDate = @RollupDate
                           ORDER BY AnalyticsTenantKey;
                           """;

        IEnumerable<RollupDailyDbRow> rows = await connection.QueryAsync<RollupDailyDbRow>(
            new CommandDefinition(sql, new { RollupDate = rollupDate }, cancellationToken: cancellationToken));

        return rows.Select(MapRow).ToList();
    }

    private static InternalCrossTenantRollupDailyRow MapRow(RollupDailyDbRow row) =>
        new()
        {
            RollupDate = row.RollupDate,
            AnalyticsTenantKey = row.AnalyticsTenantKey.Trim(),
            TotalRunsNonArchived = row.TotalRunsNonArchived,
            TotalCompletedRuns = row.TotalCompletedRuns,
            AverageCompletedRunDurationSeconds = row.AverageCompletedRunDurationSeconds,
            EstimatedEngineeringHoursSaved = row.EstimatedEngineeringHoursSaved,
            LlmTokensUsed = row.LlmTokensUsed,
            ComputedUtc = new DateTimeOffset(DateTime.SpecifyKind(row.ComputedUtc, DateTimeKind.Utc)),
        };

    private sealed class RollupDailyDbRow
    {
        public DateOnly RollupDate
        {
            get;
            init;
        }

        public string AnalyticsTenantKey
        {
            get;
            init;
        } = string.Empty;

        public long TotalRunsNonArchived
        {
            get;
            init;
        }

        public long TotalCompletedRuns
        {
            get;
            init;
        }

        public double? AverageCompletedRunDurationSeconds
        {
            get;
            init;
        }

        public decimal EstimatedEngineeringHoursSaved
        {
            get;
            init;
        }

        public long? LlmTokensUsed
        {
            get;
            init;
        }

        public DateTime ComputedUtc
        {
            get;
            init;
        }
    }
}
