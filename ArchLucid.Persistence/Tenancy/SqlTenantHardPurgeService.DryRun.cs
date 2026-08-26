using ArchLucid.Core.Tenancy;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class SqlTenantHardPurgeService
{
    private static async Task AccumulateDryRunCountsAsync(
        SqlConnection connection,
        Guid tenantId,
        TenantHardPurgeOptions options,
        Dictionary<string, int> counts,
        CancellationToken cancellationToken)
    {
        int traces = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                """
                SELECT COUNT(*) FROM dbo.AgentExecutionTraces WHERE TaskId IN (
                  SELECT TaskId FROM dbo.AgentTasks WHERE TRY_CAST(RunId AS UNIQUEIDENTIFIER) IN (
                    SELECT RunId FROM dbo.Runs WHERE TenantId = @TenantId));
                """,
                new
                {
                    TenantId = tenantId
                },
                cancellationToken: cancellationToken));

        counts["AgentExecutionTraces"] = traces;

        int tenants = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                "SELECT COUNT(*) FROM dbo.Tenants WHERE Id = @TenantId;",
                new
                {
                    TenantId = tenantId
                },
                cancellationToken: cancellationToken));

        counts["Tenants"] = tenants;

        if (await TableExistsAsync(connection, "dbo.FirstTenantFunnelEvents", cancellationToken))
        {
            int funnel = await connection.QuerySingleAsync<int>(
                new CommandDefinition(
                    "SELECT COUNT(*) FROM dbo.FirstTenantFunnelEvents WHERE TenantId = @TenantId;",
                    new
                    {
                        TenantId = tenantId
                    },
                    cancellationToken: cancellationToken));

            counts["FirstTenantFunnelEvents"] = funnel;
        }

        if (options.DeleteTenantScopedAuditEvents &&
            await TableExistsAsync(connection, "dbo.AuditEvents", cancellationToken))
        {
            int auditRows = await connection.QuerySingleAsync<int>(
                new CommandDefinition(
                    "SELECT COUNT(*) FROM dbo.AuditEvents WHERE TenantId = @TenantId;",
                    new
                    {
                        TenantId = tenantId
                    },
                    cancellationToken: cancellationToken));

            counts["AuditEvents"] = auditRows;
        }
    }
}
