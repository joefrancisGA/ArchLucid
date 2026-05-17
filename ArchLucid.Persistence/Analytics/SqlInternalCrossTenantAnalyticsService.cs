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
public sealed class SqlInternalCrossTenantAnalyticsService : IInternalCrossTenantAnalyticsService
{
    private readonly SqlConnectionFactory _connectionFactory;
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;
    private readonly ITenantDatabaseBindingRepository _tenantDatabaseBindingRepository;
    private readonly ITenantDatabaseResolver _tenantDatabaseResolver;
    private readonly IInternalCrossTenantRollupRepository _rollupRepository;
    private readonly InternalCrossTenantRollupProcessor _rollupProcessor;

    public SqlInternalCrossTenantAnalyticsService(
        SqlConnectionFactory connectionFactory,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        ITenantDatabaseBindingRepository tenantDatabaseBindingRepository,
        ITenantDatabaseResolver tenantDatabaseResolver,
        IInternalCrossTenantRollupRepository rollupRepository,
        InternalCrossTenantRollupProcessor rollupProcessor)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));
        _tenantDatabaseBindingRepository =
            tenantDatabaseBindingRepository ?? throw new ArgumentNullException(nameof(tenantDatabaseBindingRepository));
        _tenantDatabaseResolver =
            tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));
        _rollupRepository = rollupRepository ?? throw new ArgumentNullException(nameof(rollupRepository));
        _rollupProcessor = rollupProcessor ?? throw new ArgumentNullException(nameof(rollupProcessor));
    }

    /// <inheritdoc />
    public async Task<InternalCrossTenantAnalyticsSummary> GetSummaryAsync(CancellationToken cancellationToken = default)
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

            catalogs++;
            sumTotalRuns += part.TotalRunsNonArchived;
            sumCompleted += part.TotalCompletedRuns;
            sumCompletionSeconds += part.SumCompletionSeconds;
            sumHoursSaved += partHours;
        }

        return BuildSummaryFromParts(catalogs, sumTotalRuns, sumCompleted, sumCompletionSeconds, sumHoursSaved);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> GetDailyRollupsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default)
    {
        return _rollupRepository.ListDailyRowsAsync(rollupDate, cancellationToken);
    }

    /// <inheritdoc />
    public Task RefreshDailyRollupsAsync(DateOnly rollupDate, CancellationToken cancellationToken = default)
    {
        return _rollupProcessor.RefreshDailyRollupsAsync(rollupDate, cancellationToken);
    }

    /// <inheritdoc />
    public string ExportDailyRollupsCsv(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToCsv(rows);

    /// <inheritdoc />
    public string ExportDailyRollupsJson(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToJson(rows);

    private static InternalCrossTenantAnalyticsSummary BuildSummary(
        int catalogs,
        InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow rowTotals,
        decimal hoursSaved)
    {
        return BuildSummaryFromParts(
            catalogs,
            rowTotals.TotalRunsNonArchived,
            rowTotals.TotalCompletedRuns,
            rowTotals.SumCompletionSeconds,
            hoursSaved);
    }

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
