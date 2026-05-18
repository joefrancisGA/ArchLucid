using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Analytics;

[ExcludeFromCodeCoverage(Justification = "Azure SQL integration; covered by unit tests on deriver/export and integration hosts.")]
public sealed class SqlInternalCrossTenantMetricsCollector(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ITenantDatabaseBindingRepository tenantDatabaseBindingRepository,
    ITenantDatabaseResolver tenantDatabaseResolver) : IInternalCrossTenantMetricsCollector
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

    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectTenantMetricsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default) =>
        _sqlOperations.ExecuteAsync(ct => CollectTenantMetricsCoreAsync(rollupDate, ct), cancellationToken);

    private async Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectTenantMetricsCoreAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
            return await CollectSingleCatalogAsync(rollupDate, cancellationToken);

        return await CollectPerTenantCatalogAsync(rollupDate, cancellationToken);
    }

    private async Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectSingleCatalogAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await InternalCrossTenantSqlMetricsQueries.ApplyRowLevelSecurityBypassAsync(connection, cancellationToken);

        IReadOnlyList<InternalCrossTenantSqlMetricsQueries.TenantRunTotalsRow> runTotals =
            await InternalCrossTenantSqlMetricsQueries.QueryPerTenantRunTotalsAsync(connection, cancellationToken);

        IReadOnlyDictionary<Guid, long> tokenTotals =
            await InternalCrossTenantSqlMetricsQueries.QueryPerTenantLlmTokensAsync(connection, rollupDate, cancellationToken);

        List<InternalCrossTenantTenantRunMetrics> metrics = new(runTotals.Count);

        foreach (InternalCrossTenantSqlMetricsQueries.TenantRunTotalsRow row in runTotals)
        {
            decimal hoursSaved =
                await InternalCrossTenantSqlMetricsQueries.QueryEngineeringHoursSavedAsync(
                    connection,
                    row.TenantId,
                    cancellationToken);

            long? tokens = tokenTotals.TryGetValue(row.TenantId, out long tokenSum) ? tokenSum : null;

            metrics.Add(
                new InternalCrossTenantTenantRunMetrics
                {
                    TenantId = row.TenantId,
                    TotalRunsNonArchived = row.TotalRunsNonArchived,
                    TotalCompletedRuns = row.TotalCompletedRuns,
                    SumCompletionSeconds = row.SumCompletionSeconds,
                    EstimatedEngineeringHoursSaved = hoursSaved,
                    LlmTokensUsed = tokens,
                });
        }

        return metrics;
    }

    private async Task<IReadOnlyList<InternalCrossTenantTenantRunMetrics>> CollectPerTenantCatalogAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<TenantDatabaseBindingRecord> bindings =
            await _tenantDatabaseBindingRepository.ListBindingsWithStateAsync(
                TenantDatabaseProvisioningState.Active,
                cancellationToken);

        if (bindings.Count == 0)
            return [];

        List<InternalCrossTenantTenantRunMetrics> metrics = new(bindings.Count);

        foreach (TenantDatabaseBindingRecord binding in bindings)
        {
            InternalCrossTenantTenantRunMetrics part = await _sqlOperations.ExecuteAsync(
                ct => CollectPerTenantCatalogBindingAsync(binding, rollupDate, ct),
                cancellationToken);

            metrics.Add(part);
        }

        return metrics;
    }

    private async Task<InternalCrossTenantTenantRunMetrics> CollectPerTenantCatalogBindingAsync(
        TenantDatabaseBindingRecord binding,
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        string tenantConnectionString =
            await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(binding.TenantId, cancellationToken);

        await using SqlConnection tenantConnection = new(tenantConnectionString);
        await tenantConnection.OpenAsync(cancellationToken);
        await InternalCrossTenantSqlMetricsQueries.ApplyRowLevelSecurityBypassAsync(tenantConnection, cancellationToken);

        InternalCrossTenantSqlMetricsQueries.CatalogRunTotalsRow totals =
            await InternalCrossTenantSqlMetricsQueries.QueryCatalogRunTotalsAsync(tenantConnection, cancellationToken);

        decimal hoursSaved =
            await InternalCrossTenantSqlMetricsQueries.QueryEngineeringHoursSavedAsync(
                tenantConnection,
                null,
                cancellationToken);

        long? tokens =
            await InternalCrossTenantSqlMetricsQueries.QueryCatalogLlmTokensAsync(
                tenantConnection,
                binding.TenantId,
                rollupDate,
                cancellationToken);

        return new InternalCrossTenantTenantRunMetrics
        {
            TenantId = binding.TenantId,
            TotalRunsNonArchived = totals.TotalRunsNonArchived,
            TotalCompletedRuns = totals.TotalCompletedRuns,
            SumCompletionSeconds = totals.SumCompletionSeconds,
            EstimatedEngineeringHoursSaved = hoursSaved,
            LlmTokensUsed = tokens,
        };
    }
}
