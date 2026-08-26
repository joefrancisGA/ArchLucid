using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

internal sealed partial class DapperProductLearningPlanningPlanRepository
{
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
}
