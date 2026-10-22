using System.Diagnostics;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Configuration;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

internal sealed partial class DapperProductLearningPlanningPlanRepository
{
    public async Task<IReadOnlyList<ProductLearningImprovementPlanRecord>> ListPlansAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        LearningPlansHangDiagnostics.Log(
            "sql_list_plans_started",
            ("tenantId", scope.TenantId),
            ("workspaceId", scope.WorkspaceId),
            ("projectId", scope.ProjectId),
            ("take", take));

        const string sql = """
                           SELECT TOP (@Take)
                               PlanId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               ThemeId,
                               Title,
                               Summary,
                               BoundedActionsJson,
                               PriorityScore,
                               PriorityExplanation,
                               Status,
                               CreatedUtc,
                               CreatedByUserId
                           FROM dbo.ProductLearningImprovementPlans
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                           ORDER BY CreatedUtc DESC, PlanId ASC;
                           """;

        Stopwatch connectionStopwatch = Stopwatch.StartNew();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        LearningPlansHangDiagnostics.Log(
            "sql_list_plans_connection_open",
            ("connectionMs", connectionStopwatch.ElapsedMilliseconds));

        Stopwatch queryStopwatch = Stopwatch.StartNew();
        IEnumerable<ProductLearningImprovementPlanSqlRow> rows =
            await connection.QueryAsync<ProductLearningImprovementPlanSqlRow>(
                new CommandDefinition(
                    sql,
                    new { Take = take, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                    cancellationToken: cancellationToken,
                    commandTimeout: DapperCommandTimeoutSeconds.Interactive));

        List<ProductLearningImprovementPlanRecord> plans = rows.Select(static r => MapPlan(r)).ToList();

        LearningPlansHangDiagnostics.Log(
            "sql_list_plans_completed",
            ("queryMs", queryStopwatch.ElapsedMilliseconds),
            ("rowCount", plans.Count));

        return plans;
    }

    public async Task<IReadOnlyList<ProductLearningImprovementPlanListRecord>> ListPlanListItemsAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        LearningPlansHangDiagnostics.Log(
            "sql_list_plan_items_started",
            ("tenantId", scope.TenantId),
            ("workspaceId", scope.WorkspaceId),
            ("projectId", scope.ProjectId),
            ("take", take));

        const string sql = """
                           SELECT TOP (@Take)
                               p.PlanId,
                               p.ThemeId,
                               p.Title,
                               p.Summary,
                               p.PriorityScore,
                               p.PriorityExplanation,
                               p.Status,
                               p.CreatedUtc,
                               t.EvidenceSignalCount AS ThemeEvidenceSignalCount
                           FROM dbo.ProductLearningImprovementPlans p
                           LEFT JOIN dbo.ProductLearningImprovementThemes t
                               ON t.ThemeId = p.ThemeId
                              AND t.TenantId = p.TenantId
                              AND t.WorkspaceId = p.WorkspaceId
                              AND t.ProjectId = p.ProjectId
                           WHERE p.TenantId = @TenantId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                           ORDER BY p.CreatedUtc DESC, p.PlanId ASC;
                           """;

        Stopwatch connectionStopwatch = Stopwatch.StartNew();
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        LearningPlansHangDiagnostics.Log(
            "sql_list_plan_items_connection_open",
            ("connectionMs", connectionStopwatch.ElapsedMilliseconds));

        Stopwatch queryStopwatch = Stopwatch.StartNew();
        IEnumerable<ProductLearningImprovementPlanListSqlRow> rows =
            await connection.QueryAsync<ProductLearningImprovementPlanListSqlRow>(
                new CommandDefinition(
                    sql,
                    new { Take = take, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                    cancellationToken: cancellationToken,
                    commandTimeout: DapperCommandTimeoutSeconds.Interactive));

        List<ProductLearningImprovementPlanListRecord> plans = rows.Select(MapPlanListItem).ToList();

        LearningPlansHangDiagnostics.Log(
            "sql_list_plan_items_completed",
            ("queryMs", queryStopwatch.ElapsedMilliseconds),
            ("rowCount", plans.Count));

        return plans;
    }

    public async Task<IReadOnlyList<ProductLearningImprovementPlanRecord>> ListPlansForThemeAsync(
        Guid themeId,
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        const string sql = """
                           SELECT TOP (@Take)
                               PlanId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               ThemeId,
                               Title,
                               Summary,
                               BoundedActionsJson,
                               PriorityScore,
                               PriorityExplanation,
                               Status,
                               CreatedUtc,
                               CreatedByUserId
                           FROM dbo.ProductLearningImprovementPlans
                           WHERE ThemeId = @ThemeId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                           ORDER BY CreatedUtc DESC, PlanId ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningImprovementPlanSqlRow> rows =
            await connection.QueryAsync<ProductLearningImprovementPlanSqlRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        ThemeId = themeId,
                        Take = take,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId
                    },
                    cancellationToken: cancellationToken));

        return rows.Select(static r => MapPlan(r)).ToList();
    }
}
