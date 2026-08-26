using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
internal sealed class DapperProductLearningPlanningPlanRepository(ISqlConnectionFactory connectionFactory)
{
    public async Task InsertPlanAsync(ProductLearningImprovementPlanRecord plan, CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsurePlan(plan);

        string status = ProductLearningPlanningRepositoryValidation.NormalizePlanStatus(plan.Status);
        string actionsJson = ProductLearningPlanningJsonSerializer.SerializeActionSteps(plan.ActionSteps);
        Guid planId = plan.PlanId == Guid.Empty ? Guid.NewGuid() : plan.PlanId;
        DateTime createdUtc = plan.CreatedUtc == default ? TimeProvider.System.UtcNowDateTime() : plan.CreatedUtc;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await EnsureThemeScopeMatchesAsync(connection, plan.ThemeId, plan, cancellationToken);

        const string sql = """
                           INSERT INTO dbo.ProductLearningImprovementPlans
                           (
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
                           )
                           VALUES
                           (
                               @PlanId,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @ThemeId,
                               @Title,
                               @Summary,
                               @BoundedActionsJson,
                               @PriorityScore,
                               @PriorityExplanation,
                               @Status,
                               @CreatedUtc,
                               @CreatedByUserId
                           );
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    PlanId = planId,
                    plan.TenantId,
                    plan.WorkspaceId,
                    plan.ProjectId,
                    plan.ThemeId,
                    plan.Title,
                    plan.Summary,
                    BoundedActionsJson = actionsJson,
                    plan.PriorityScore,
                    plan.PriorityExplanation,
                    Status = status,
                    CreatedUtc = createdUtc,
                    plan.CreatedByUserId
                },
                cancellationToken: cancellationToken));
    }

    public async Task<ProductLearningImprovementPlanRecord?> GetPlanAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        const string sql = """
                           SELECT
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
                           WHERE PlanId = @PlanId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        ProductLearningImprovementPlanSqlRow? row =
            await connection.QuerySingleOrDefaultAsync<ProductLearningImprovementPlanSqlRow>(
                new CommandDefinition(
                    sql,
                    new { PlanId = planId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                    cancellationToken: cancellationToken));

        return row is null ? null : MapPlan(row);
    }

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

    private static ProductLearningImprovementPlanListRecord MapPlanListItem(ProductLearningImprovementPlanListSqlRow row)
    {
        return new ProductLearningImprovementPlanListRecord
        {
            PlanId = row.PlanId,
            ThemeId = row.ThemeId,
            Title = row.Title,
            Summary = row.Summary,
            PriorityScore = row.PriorityScore,
            PriorityExplanation = row.PriorityExplanation,
            Status = row.Status,
            CreatedUtc = row.CreatedUtc,
            ThemeEvidenceSignalCount = row.ThemeEvidenceSignalCount,
        };
    }

    private static ProductLearningImprovementPlanRecord MapPlan(ProductLearningImprovementPlanSqlRow row)
    {
        IReadOnlyList<ProductLearningImprovementPlanActionStep> steps =
            ProductLearningPlanningJsonSerializer.DeserializeActionSteps(row.BoundedActionsJson);

        return new ProductLearningImprovementPlanRecord
        {
            PlanId = row.PlanId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            ThemeId = row.ThemeId,
            Title = row.Title,
            Summary = row.Summary,
            ActionSteps = steps,
            PriorityScore = row.PriorityScore,
            PriorityExplanation = row.PriorityExplanation,
            Status = row.Status,
            CreatedUtc = row.CreatedUtc,
            CreatedByUserId = row.CreatedByUserId
        };
    }

    private static async Task EnsureThemeScopeMatchesAsync(
        SqlConnection connection,
        Guid themeId,
        ProductLearningImprovementPlanRecord plan,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, WorkspaceId, ProjectId
                           FROM dbo.ProductLearningImprovementThemes
                           WHERE ThemeId = @ThemeId;
                           """;

        ProductLearningScopeSqlRow? row = await connection.QuerySingleOrDefaultAsync<ProductLearningScopeSqlRow>(
            new CommandDefinition(sql, new { ThemeId = themeId }, cancellationToken: cancellationToken));

        if (row is null)
            throw new InvalidOperationException("Theme not found for ThemeId=" + themeId + ".");


        if (row.TenantId != plan.TenantId || row.WorkspaceId != plan.WorkspaceId || row.ProjectId != plan.ProjectId)

            throw new InvalidOperationException("Plan scope must match the parent theme scope.");
    }

    private sealed class ProductLearningImprovementPlanListSqlRow
    {
        public Guid PlanId
        {
            get;
            set;
        }

        public Guid ThemeId
        {
            get;
            set;
        }

        public string Title
        {
            get;
            set;
        } = string.Empty;

        public string Summary
        {
            get;
            set;
        } = string.Empty;

        public int PriorityScore
        {
            get;
            set;
        }

        public string? PriorityExplanation
        {
            get;
            set;
        }

        public string Status
        {
            get;
            set;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public int? ThemeEvidenceSignalCount
        {
            get;
            set;
        }
    }
}
