using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class SqlTenantHardPurgeService
{
    private static async Task<int> DeleteProductLearningPlanChildrenAsync(
        SqlConnection connection,
        Guid tenantId,
        int cap,
        Dictionary<string, int> counts,
        CancellationToken cancellationToken)
    {
        int total = 0;

        if (await TableExistsAsync(connection, "dbo.ProductLearningImprovementPlanArchitectureRuns", cancellationToken))

            total += await DeleteLoopAsync(
                connection,
                """
                DELETE TOP (@Cap) FROM dbo.ProductLearningImprovementPlanArchitectureRuns
                WHERE PlanId IN (SELECT PlanId FROM dbo.ProductLearningImprovementPlans WHERE TenantId = @TenantId);
                """,
                tenantId,
                cap,
                counts,
                "ProductLearningImprovementPlanArchitectureRuns",
                cancellationToken);

        if (await TableExistsAsync(connection, "dbo.ProductLearningImprovementPlanSignalLinks", cancellationToken))

            total += await DeleteLoopAsync(
                connection,
                """
                DELETE TOP (@Cap) FROM dbo.ProductLearningImprovementPlanSignalLinks
                WHERE PlanId IN (SELECT PlanId FROM dbo.ProductLearningImprovementPlans WHERE TenantId = @TenantId);
                """,
                tenantId,
                cap,
                counts,
                "ProductLearningImprovementPlanSignalLinks",
                cancellationToken);

        return total;
    }

    private static async Task<int> DeleteTenantScopedTablesAsync(
        SqlConnection connection,
        Guid tenantId,
        int cap,
        Dictionary<string, int> counts,
        CancellationToken cancellationToken)
    {
        int total = 0;

        foreach (string table in AllowedTenantScopedPurgeTables)
        {
            if (!await TableExistsAsync(connection, table, cancellationToken))
                continue;

            string label = table.Replace("dbo.", string.Empty, StringComparison.Ordinal);
            string sql = BuildPurgeSql(table);
            total += await DeleteLoopAsync(connection, sql, tenantId, cap, counts, label, cancellationToken);
        }

        return total;
    }

    private static async Task<bool> TableExistsAsync(SqlConnection connection, string qualifiedName,
        CancellationToken cancellationToken)
    {
        string name = qualifiedName.Split('.', 2)[1];

        const string sql = """
                           SELECT COUNT(*) FROM sys.tables t
                           WHERE t.schema_id = SCHEMA_ID(N'dbo') AND t.name = @Name;
                           """;

        int c = await connection.QuerySingleAsync<int>(
            new CommandDefinition(sql, new
            {
                Name = name
            }, cancellationToken: cancellationToken));

        return c > 0;
    }

    private static async Task<int> DeleteLoopAsync(
        SqlConnection connection,
        string sql,
        Guid tenantId,
        int cap,
        Dictionary<string, int> counts,
        string key,
        CancellationToken cancellationToken)
    {
        int total = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            int affected = await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        Cap = cap
                    },
                    cancellationToken: cancellationToken));

            if (affected == 0)
                break;

            total += affected;
        }

        if (total > 0)

            counts[key] = counts.GetValueOrDefault(key, 0) + total;

        return total;
    }
}
