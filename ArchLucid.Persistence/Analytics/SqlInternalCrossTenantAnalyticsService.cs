using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

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

    public SqlInternalCrossTenantAnalyticsService(
        SqlConnectionFactory connectionFactory,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        ITenantDatabaseBindingRepository tenantDatabaseBindingRepository,
        ITenantDatabaseResolver tenantDatabaseResolver)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));
        _tenantDatabaseBindingRepository =
            tenantDatabaseBindingRepository ?? throw new ArgumentNullException(nameof(tenantDatabaseBindingRepository));
        _tenantDatabaseResolver =
            tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));
    }

    /// <inheritdoc />
    public async Task<InternalCrossTenantAnalyticsSummary> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
        {
            await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
            await ApplyRowLevelSecurityBypassAsync(connection, cancellationToken);
            RowTotals rowTotals = await QueryRunTotalsAsync(connection, cancellationToken);
            decimal hoursSaved = await QueryEngineeringHoursSavedIfPresentAsync(connection, cancellationToken);

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
            await ApplyRowLevelSecurityBypassAsync(tenantConnection, cancellationToken);
            RowTotals part = await QueryRunTotalsAsync(tenantConnection, cancellationToken);
            decimal partHours = await QueryEngineeringHoursSavedIfPresentAsync(tenantConnection, cancellationToken);
            catalogs++;
            sumTotalRuns += part.TotalRunsNonArchived;
            sumCompleted += part.CompletedRuns;
            sumCompletionSeconds += part.SumCompletionSeconds;
            sumHoursSaved += partHours;
        }

        return BuildSummaryFromParts(catalogs, sumTotalRuns, sumCompleted, sumCompletionSeconds, sumHoursSaved);
    }

    private static InternalCrossTenantAnalyticsSummary BuildSummary(
        int catalogs,
        RowTotals rowTotals,
        decimal hoursSaved)
    {
        return BuildSummaryFromParts(
            catalogs,
            rowTotals.TotalRunsNonArchived,
            rowTotals.CompletedRuns,
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

    /// <summary>
    ///     When RLS policies are enabled, this key must be set on the connection before cross-tenant aggregates that
    ///     intentionally span tenants (see <c>rls.archlucid_scope_predicate</c> in DbUp migrations).
    /// </summary>
    private static async Task ApplyRowLevelSecurityBypassAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = @Bypass, @read_only = 0;
            """;
        SqlParameter bypass = cmd.Parameters.Add("@Bypass", SqlDbType.Int);
        bypass.Value = 1;

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<RowTotals> QueryRunTotalsAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT (SELECT COUNT(*)
                                   FROM dbo.Runs AS r
                                   WHERE r.ArchivedUtc IS NULL) AS TotalRunsNonArchived,
                                  (SELECT COUNT(*)
                                   FROM dbo.Runs AS r
                                   WHERE r.CompletedUtc IS NOT NULL
                                     AND r.ArchivedUtc IS NULL) AS CompletedRuns,
                                  (SELECT ISNULL(SUM(CAST(DATEDIFF_BIG(SECOND, r.CreatedUtc, r.CompletedUtc) AS FLOAT)),
                                                 0.0)
                                   FROM dbo.Runs AS r
                                   WHERE r.CompletedUtc IS NOT NULL
                                     AND r.ArchivedUtc IS NULL) AS SumCompletionSeconds;
                           """;

        RowTotals row = await connection.QuerySingleAsync<RowTotals>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return row;
    }

    private static async Task<decimal> QueryEngineeringHoursSavedIfPresentAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string existsSql = """
                                 SELECT CASE WHEN OBJECT_ID(N'dbo.RunTelemetry', N'U') IS NULL THEN 0 ELSE 1 END;
                                 """;

        int exists = await connection.QuerySingleAsync<int>(new CommandDefinition(existsSql, cancellationToken: cancellationToken));

        if (exists == 0)
            return 0;

        const string sql = """
                           SELECT CAST(ISNULL(SUM(CAST(rt.EstimatedHoursSaved AS DECIMAL(18, 2))), 0) AS DECIMAL(18, 2))
                           FROM dbo.RunTelemetry AS rt
                                    INNER JOIN dbo.Runs AS r ON r.RunId = rt.RunId
                           WHERE r.ArchivedUtc IS NULL;
                           """;

        return await connection.QuerySingleAsync<decimal>(new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    private sealed record RowTotals(
        long TotalRunsNonArchived,
        long CompletedRuns,
        double SumCompletionSeconds);
}
