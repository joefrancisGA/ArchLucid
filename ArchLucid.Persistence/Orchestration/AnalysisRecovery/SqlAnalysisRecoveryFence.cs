using System.Data;

using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Fences the existing independently committed SecureNow SQL writers without extending their transaction lifetimes.</summary>
public static class SqlAnalysisRecoveryFence
{
    public static async Task DemandAsync(IDbConnection db, IDbTransaction transaction,
        Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        if (AnalysisRecoveryFenceContext.Current is not { } active)
            return;

        await DemandParentsAsync(active);

        async Task DemandParentsAsync(AnalysisRecoveryFenceContext item)
        {
            if (item.Previous is not null)
                await DemandParentsAsync(item.Previous);

            AnalysisRecoveryStageKey key = item.Key;

            if (!key.Scope.Matches(tenantId, workspaceId, projectId))
                throw new InvalidOperationException("Recovery stage cannot write outside its pinned project.");

            const string sql = """
                SELECT COUNT_BIG(1) FROM dbo.AnalysisStageRecovery WITH (UPDLOCK, HOLDLOCK)
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                  AND Pipeline = @Pipeline AND RunId = @RunId AND Stage = @Stage
                  AND Owner = @Owner AND Fence = @Fence AND State = N'running' AND LeaseUntilUtc > SYSUTCDATETIME();
                """;

            if (await db.ExecuteScalarAsync<long>(new CommandDefinition(sql, new
                {
                    TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId,
                    key.Pipeline, key.RunId, key.Stage, item.Owner, item.Fence
                }, transaction, cancellationToken: ct)) != 1)
            {
                throw new InvalidOperationException("The analysis writer no longer owns its fenced SQL stage.");
            }
        }
    }
}
