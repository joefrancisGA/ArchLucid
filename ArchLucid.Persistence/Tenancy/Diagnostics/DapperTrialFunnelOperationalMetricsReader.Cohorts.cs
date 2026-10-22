using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Tenancy;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

public sealed partial class DapperTrialFunnelOperationalMetricsReader
{
    private static async Task<IReadOnlyList<TrialFunnelCohortRowResponse>> LoadCohortRowsAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] demoSlugs,
        DateTimeOffset utcNow,
        bool costRatesConfigured,
        CancellationToken cancellationToken)
    {
        DateTime utcNowDate = utcNow.UtcDateTime;

        const string sql = """
                           SELECT
                               t.Id AS TenantId,
                               t.Name AS OrganizationName,
                               t.TrialStartUtc,
                               t.TrialExpiresUtc,
                               t.TrialStatus,
                               t.TrialFirstManifestCommittedUtc,
                               t.TrialRunsUsed,
                               activity.LastActivityUtc,
                               cost.EstimatedFirstReviewCostUsd
                           FROM dbo.Tenants t
                           OUTER APPLY (
                               SELECT MAX(r.CreatedUtc) AS LastActivityUtc
                               FROM dbo.Runs r
                               WHERE r.TenantId = t.Id
                                 AND r.ArchivedUtc IS NULL
                           ) activity
                           OUTER APPLY (
                               SELECT TOP (1) (s.SpentUsd + s.ReservedAssumedUsd) AS EstimatedFirstReviewCostUsd
                               FROM dbo.LlmMonthlyTenantBudgetState s
                               WHERE s.TenantId = t.Id
                                 AND s.UtcYear = @UtcYear
                                 AND s.UtcMonth = @UtcMonth
                                 AND t.TrialFirstManifestCommittedUtc IS NOT NULL
                           ) cost
                           WHERE t.TrialExpiresUtc IS NOT NULL
                             AND t.OffboardedUtc IS NULL
                             AND t.SuspendedUtc IS NULL
                             AND t.TrialStartUtc >= @SinceUtc
                             AND t.Slug NOT IN @DemoSlugs
                           ORDER BY t.TrialStartUtc DESC;
                           """;

        IEnumerable<TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow> rows =
            await connection.QueryAsync<TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        SinceUtc = sinceUtc.UtcDateTime,
                        UtcYear = utcNowDate.Year,
                        UtcMonth = utcNowDate.Month,
                        DemoSlugs = demoSlugs,
                    },
                    cancellationToken: cancellationToken));

        return rows
            .Select(row => MapCohortRow(row, utcNow, costRatesConfigured))
            .ToList();
    }

    private static TrialFunnelCohortRowResponse MapCohortRow(
        TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow row,
        DateTimeOffset utcNow,
        bool costRatesConfigured)
    {
        int? daysInTrial = row.TrialStartedUtc is null
            ? null
            : (int)Math.Max(0, (utcNow - row.TrialStartedUtc.Value).TotalDays);

        string firstReviewStatus = row.TrialFirstManifestCommittedUtc is not null
            ? "Finalized"
            : row.TrialRunsUsed > 0
                ? "In progress"
                : "Not started";

        string conversionStatus = string.Equals(row.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal)
            ? "Converted"
            : "Trial";

        decimal? estimatedCost = row.EstimatedFirstReviewCostUsd is > 0m && costRatesConfigured
            ? row.EstimatedFirstReviewCostUsd
            : null;

        return new TrialFunnelCohortRowResponse
        {
            TenantId = row.TenantId,
            OrganizationName = row.OrganizationName,
            TrialStartedUtc = row.TrialStartedUtc,
            CurrentStageId = TrialFunnelOperationalSummaryBuilder.ResolveCohortStageId(row),
            CurrentStageLabel = TrialFunnelOperationalSummaryBuilder.ResolveCohortStageLabel(row),
            DaysInTrial = daysInTrial,
            LastMeaningfulActivityUtc = row.LastActivityUtc,
            FirstReviewStatus = firstReviewStatus,
            EstimatedFirstReviewCostUsd = estimatedCost,
            ConversionStatus = conversionStatus,
            AttentionLabel = TrialFunnelOperationalSummaryBuilder.ResolveAttentionLabel(row, utcNow),
        };
    }
}
