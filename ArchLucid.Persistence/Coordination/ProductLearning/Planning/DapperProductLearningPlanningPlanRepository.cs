using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
internal sealed partial class DapperProductLearningPlanningPlanRepository(ISqlConnectionFactory connectionFactory)
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
}
