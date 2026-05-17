using System.Data;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Analytics;

internal static class InternalCrossTenantSqlMetricsQueries
{
    internal sealed record TenantRunTotalsRow(
        Guid TenantId,
        long TotalRunsNonArchived,
        long TotalCompletedRuns,
        double SumCompletionSeconds);

    internal sealed record CatalogRunTotalsRow(
        long TotalRunsNonArchived,
        long TotalCompletedRuns,
        double SumCompletionSeconds);

    internal static async Task ApplyRowLevelSecurityBypassAsync(
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

    internal static async Task<IReadOnlyList<TenantRunTotalsRow>> QueryPerTenantRunTotalsAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT r.TenantId,
                                  SUM(CASE WHEN r.ArchivedUtc IS NULL THEN 1 ELSE 0 END) AS TotalRunsNonArchived,
                                  SUM(CASE
                                          WHEN r.CompletedUtc IS NOT NULL AND r.ArchivedUtc IS NULL THEN 1
                                          ELSE 0 END) AS TotalCompletedRuns,
                                  SUM(CASE
                                          WHEN r.CompletedUtc IS NOT NULL AND r.ArchivedUtc IS NULL
                                              THEN CAST(DATEDIFF_BIG(SECOND, r.CreatedUtc, r.CompletedUtc) AS FLOAT)
                                          ELSE 0.0 END) AS SumCompletionSeconds
                           FROM dbo.Runs AS r
                           GROUP BY r.TenantId;
                           """;

        IEnumerable<TenantRunTotalsRow> rows = await connection.QueryAsync<TenantRunTotalsRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    internal static async Task<CatalogRunTotalsRow> QueryCatalogRunTotalsAsync(
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
                                     AND r.ArchivedUtc IS NULL) AS TotalCompletedRuns,
                                  (SELECT ISNULL(SUM(CAST(DATEDIFF_BIG(SECOND, r.CreatedUtc, r.CompletedUtc) AS FLOAT)),
                                                 0.0)
                                   FROM dbo.Runs AS r
                                   WHERE r.CompletedUtc IS NOT NULL
                                     AND r.ArchivedUtc IS NULL) AS SumCompletionSeconds;
                           """;

        return await connection.QuerySingleAsync<CatalogRunTotalsRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    internal static async Task<decimal> QueryEngineeringHoursSavedAsync(
        SqlConnection connection,
        Guid? tenantId,
        CancellationToken cancellationToken)
    {
        const string existsSql = """
                                 SELECT CASE WHEN OBJECT_ID(N'dbo.RunTelemetry', N'U') IS NULL THEN 0 ELSE 1 END;
                                 """;

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(existsSql, cancellationToken: cancellationToken));

        if (exists == 0)
            return 0;

        string sql = tenantId.HasValue
            ? """
              SELECT CAST(ISNULL(SUM(CAST(rt.EstimatedHoursSaved AS DECIMAL(18, 2))), 0) AS DECIMAL(18, 2))
              FROM dbo.RunTelemetry AS rt
                       INNER JOIN dbo.Runs AS r ON r.RunId = rt.RunId
              WHERE r.ArchivedUtc IS NULL
                AND r.TenantId = @TenantId;
              """
            : """
              SELECT CAST(ISNULL(SUM(CAST(rt.EstimatedHoursSaved AS DECIMAL(18, 2))), 0) AS DECIMAL(18, 2))
              FROM dbo.RunTelemetry AS rt
                       INNER JOIN dbo.Runs AS r ON r.RunId = rt.RunId
              WHERE r.ArchivedUtc IS NULL;
              """;

        return await connection.QuerySingleAsync<decimal>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));
    }

    internal static async Task<IReadOnlyDictionary<Guid, long>> QueryPerTenantLlmTokensAsync(
        SqlConnection connection,
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        const string existsSql = """
                                 SELECT CASE WHEN OBJECT_ID(N'dbo.LlmDailyTenantTokenWindowState', N'U') IS NULL THEN 0 ELSE 1 END;
                                 """;

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(existsSql, cancellationToken: cancellationToken));

        if (exists == 0)
            return new Dictionary<Guid, long>();

        const string sql = """
                           SELECT w.TenantId, SUM(w.TotalTokens) AS TotalTokens
                           FROM dbo.LlmDailyTenantTokenWindowState AS w
                           WHERE w.UtcDay = @UtcDay
                           GROUP BY w.TenantId;
                           """;

        IEnumerable<(Guid TenantId, long TotalTokens)> rows = await connection.QueryAsync<(Guid TenantId, long TotalTokens)>(
            new CommandDefinition(sql, new { UtcDay = rollupDate }, cancellationToken: cancellationToken));

        return rows.ToDictionary(static row => row.TenantId, static row => row.TotalTokens);
    }

    internal static async Task<long?> QueryCatalogLlmTokensAsync(
        SqlConnection connection,
        Guid tenantId,
        DateOnly rollupDate,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<Guid, long> map = await QueryPerTenantLlmTokensAsync(connection, rollupDate, cancellationToken);

        if (!map.TryGetValue(tenantId, out long tokens))
            return null;

        return tokens;
    }
}
