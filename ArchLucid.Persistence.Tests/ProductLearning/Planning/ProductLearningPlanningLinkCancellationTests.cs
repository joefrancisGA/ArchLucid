using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Tests.ProductLearning.Planning;

[Trait("Category", "Unit")]
[Trait("ChangeSet", "59R")]
public sealed class ProductLearningPlanningLinkCancellationTests
{
    [SkippableFact]
    public async Task Add_plan_run_link_honors_cancellation_without_persisting()
    {
        InMemoryProductLearningPlanningRepository repo = new();
        ProductLearningScope scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };

        await repo.InsertThemeAsync(
            new ProductLearningImprovementThemeRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                ThemeKey = "cancel-link",
                Title = "Theme",
                Summary = "Summary",
                AffectedArtifactTypeOrWorkflowArea = "Planning",
                SeverityBand = "Low",
                EvidenceSignalCount = 1,
                DistinctRunCount = 1,
                DerivationRuleVersion = "59R-v1"
            },
            CancellationToken.None);

        Guid themeId = (await repo.ListThemesAsync(scope, 1, CancellationToken.None))[0].ThemeId;
        await repo.InsertPlanAsync(
            new ProductLearningImprovementPlanRecord
            {
                ThemeId = themeId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                Title = "Plan",
                Summary = "Summary",
                ActionSteps =
                [
                    new ProductLearningImprovementPlanActionStep
                    {
                        Ordinal = 1,
                        ActionType = "Review",
                        Description = "Review the cancellation boundary"
                    }
                ],
                PriorityScore = 1
            },
            CancellationToken.None);

        Guid planId = (await repo.ListPlansAsync(scope, 1, CancellationToken.None))[0].PlanId;
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            repo.AddPlanArchitectureRunLinkAsync(
                new ProductLearningImprovementPlanRunLinkRecord
                {
                    PlanId = planId,
                    ArchitectureRunId = "run-canceled"
                },
                cancellation.Token));

        Assert.Empty(await repo.ListPlanArchitectureRunIdsAsync(planId, scope, CancellationToken.None));
    }
}
