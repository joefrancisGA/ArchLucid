using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Analytics;

/// <summary>
///     Reads anonymized aggregates from tenant product catalogs. Uses <c>al_rls_bypass</c> session context so optional
///     SQL RLS policies see all rows in single-catalog deployments; in per-tenant-catalog mode, opens each active
///     binding (no tenant ids in the HTTP payload).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Azure SQL integration; validated via host integration and manual operator checks.")]
public sealed class SqlInternalCrossTenantAnalyticsService(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ITenantDatabaseBindingRepository tenantDatabaseBindingRepository,
    ITenantDatabaseResolver tenantDatabaseResolver,
    IInternalCrossTenantRollupRepository rollupRepository,
    InternalCrossTenantRollupProcessor rollupProcessor) : IInternalCrossTenantAnalyticsService
{
    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly ITenantDatabaseBindingRepository _tenantDatabaseBindingRepository =
        tenantDatabaseBindingRepository ?? throw new ArgumentNullException(nameof(tenantDatabaseBindingRepository));

    private readonly ITenantDatabaseResolver _tenantDatabaseResolver =
        tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));

    private readonly IInternalCrossTenantRollupRepository _rollupRepository =
        rollupRepository ?? throw new ArgumentNullException(nameof(rollupRepository));

    private readonly InternalCrossTenantRollupProcessor _rollupProcessor =
        rollupProcessor ?? throw new ArgumentNullException(nameof(rollupProcessor));

    /// <inheritdoc />
    public Task<InternalCrossTenantAnalyticsSummary> GetSummaryAsync(CancellationToken cancellationToken = default) =>
        _sqlOperations.ExecuteAsync(ct => GetSummaryCoreAsync(ct), cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> GetDailyRollupsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default) =>
        _rollupRepository.ListDailyRowsAsync(rollupDate, cancellationToken);

    /// <inheritdoc />
    public Task RefreshDailyRollupsAsync(DateOnly rollupDate, CancellationToken cancellationToken = default) =>
        _rollupProcessor.RefreshDailyRollupsAsync(rollupDate, cancellationToken);

    /// <inheritdoc />
    public string ExportDailyRollupsCsv(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToCsv(rows);

    /// <inheritdoc />
    public string ExportDailyRollupsJson(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToJson(rows);

    private async Task<InternalCrossTenantAnalyticsSummary> GetSummaryCoreAsync(CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
        {
            await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
            await InternalCrossTenantSqlMetricsQueries.ApplyRowLevelSecurityBypassAsync(connection, cancellationToken);

            InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow rowTotals =
                await InternalCrossTenantSqlMetricsQueries.QueryCatalogRunTotalsAsync(connection, cancellationToken);

            decimal hoursSaved =
                await InternalCrossTenantSqlMetricsQueries.QueryEngineeringHoursSavedAsync(connection, null, cancellationToken);

            return BuildSummary(1, rowTotals, hoursSaved);
        }

        IReadOnlyList<TenantDatabaseBindingRecord> bindings =
            await _tenantDatabaseBindingRepository.ListBindingsWithStateAsync(
                TenantDatabaseProvisioningState.Active,
                cancellationToken);

        if (bindings.Count == 0)
        {
            return new InternalCrossTenantAnalyticsSummary
            {
                CatalogsAggregated = 0,
                TotalRunsNonArchived = 0,
                TotalCompletedRuns = 0,
                AverageCompletedRunDurationSeconds = null,
                TotalEstimatedEngineeringHoursSaved = 0,
            };
        }

        long sumTotalRuns = 0;
        long sumCompleted = 0;
        double sumCompletionSeconds = 0;
        decimal sumHoursSaved = 0;
        int catalogs = 0;

        foreach (TenantDatabaseBindingRecord binding in bindings)
        {
            (InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow part, decimal partHours) =
                await _sqlOperations.ExecuteAsync(
                    ct => QueryPerTenantCatalogSummaryAsync(binding, ct),
                    cancellationToken);

            catalogs++;
            sumTotalRuns += part.TotalRunsNonArchived;
            sumCompleted += part.TotalCompletedRuns;
            sumCompletionSeconds += part.SumCompletionSeconds;
            sumHoursSaved += partHours;
        }

        return BuildSummaryFromParts(catalogs, sumTotalRuns, sumCompleted, sumCompletionSeconds, sumHoursSaved);
    }

    private async Task<(InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow Totals, decimal HoursSaved)>
        QueryPerTenantCatalogSummaryAsync(
            TenantDatabaseBindingRecord binding,
            CancellationToken cancellationToken)
    {
        string tenantConnectionString =
            await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(binding.TenantId, cancellationToken);

        await using SqlConnection tenantConnection = new(tenantConnectionString);
        await tenantConnection.OpenAsync(cancellationToken);
        await InternalCrossTenantSqlMetricsQueries.ApplyRowLevelSecurityBypassAsync(tenantConnection, cancellationToken);

        InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow part =
            await InternalCrossTenantSqlMetricsQueries.QueryCatalogRunTotalsAsync(tenantConnection, cancellationToken);

        decimal partHours =
            await InternalCrossTenantSqlMetricsQueries.QueryEngineeringHoursSavedAsync(
                tenantConnection,
                null,
                cancellationToken);

        return (part, partHours);
    }

    private static InternalCrossTenantAnalyticsSummary BuildSummary(
        int catalogs,
        InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow rowTotals,
        decimal hoursSaved) =>
        BuildSummaryFromParts(
            catalogs,
            rowTotals.TotalRunsNonArchived,
            rowTotals.TotalCompletedRuns,
            rowTotals.SumCompletionSeconds,
            hoursSaved);

    private static InternalCrossTenantAnalyticsSummary BuildSummaryFromParts(
        int catalogs,
        long sumTotalRuns,
        long sumCompleted,
        double sumCompletionSeconds,
        decimal sumHoursSaved)
    {
        double? avg = null;

        if (sumCompleted > 0)
            avg = sumCompletionSeconds / sumCompleted;

        return new InternalCrossTenantAnalyticsSummary
        {
            CatalogsAggregated = catalogs,
            TotalRunsNonArchived = sumTotalRuns,
            TotalCompletedRuns = sumCompleted,
            AverageCompletedRunDurationSeconds = avg,
            TotalEstimatedEngineeringHoursSaved = sumHoursSaved,
        };
    }
}
