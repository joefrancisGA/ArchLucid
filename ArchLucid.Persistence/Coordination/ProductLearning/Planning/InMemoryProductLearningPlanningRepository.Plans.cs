using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

public sealed partial class InMemoryProductLearningPlanningRepository
{
    public Task InsertPlanAsync(ProductLearningImprovementPlanRecord plan, CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsurePlan(plan);

        string status = ProductLearningPlanningRepositoryValidation.NormalizePlanStatus(plan.Status);
        Guid planId = plan.PlanId == Guid.Empty ? Guid.NewGuid() : plan.PlanId;
        DateTime createdUtc = plan.CreatedUtc == default ? TimeProvider.System.UtcNowDateTime() : plan.CreatedUtc;

        ProductLearningImprovementThemeRecord? theme = _themes.FirstOrDefault(t =>
            t.ThemeId == plan.ThemeId &&
            t.TenantId == plan.TenantId &&
            t.WorkspaceId == plan.WorkspaceId &&
            t.ProjectId == plan.ProjectId);

        if (theme is null)
            throw new InvalidOperationException("Theme not found for ThemeId=" + plan.ThemeId + ".");


        IReadOnlyList<ProductLearningImprovementPlanActionStep> stepsCopy = plan.ActionSteps
            .OrderBy(static s => s.Ordinal)
            .Select(static s => new ProductLearningImprovementPlanActionStep
            {
                Ordinal = s.Ordinal,
                ActionType = s.ActionType,
                Description = s.Description,
                AcceptanceCriteria = s.AcceptanceCriteria
            })
            .ToList();

        ProductLearningImprovementPlanRecord stored = new()
        {
            PlanId = planId,
            TenantId = plan.TenantId,
            WorkspaceId = plan.WorkspaceId,
            ProjectId = plan.ProjectId,
            ThemeId = plan.ThemeId,
            Title = plan.Title,
            Summary = plan.Summary,
            ActionSteps = stepsCopy,
            PriorityScore = plan.PriorityScore,
            PriorityExplanation = plan.PriorityExplanation,
            Status = status,
            CreatedUtc = createdUtc,
            CreatedByUserId = plan.CreatedByUserId
        };

        _plans.Add(stored);

        return Task.CompletedTask;
    }

    public Task<ProductLearningImprovementPlanRecord?> GetPlanAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        ProductLearningImprovementPlanRecord? found = _plans.FirstOrDefault(p =>
            p.PlanId == planId &&
            p.TenantId == scope.TenantId &&
            p.WorkspaceId == scope.WorkspaceId &&
            p.ProjectId == scope.ProjectId);

        return Task.FromResult(found);
    }

    public Task<IReadOnlyList<ProductLearningImprovementPlanRecord>> ListPlansAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        List<ProductLearningImprovementPlanRecord> list = _plans
            .Where(p =>
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId)
            .OrderByDescending(static p => p.CreatedUtc)
            .ThenBy(static p => p.PlanId)
            .Take(take)
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanRecord>>(list);
    }

    public Task<IReadOnlyList<ProductLearningImprovementPlanListRecord>> ListPlanListItemsAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        List<ProductLearningImprovementPlanListRecord> list = _plans
            .Where(p =>
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId)
            .OrderByDescending(static p => p.CreatedUtc)
            .ThenBy(static p => p.PlanId)
            .Take(take)
            .Select(p =>
            {
                ProductLearningImprovementThemeRecord? theme = _themes.FirstOrDefault(t => t.ThemeId == p.ThemeId);

                return new ProductLearningImprovementPlanListRecord
                {
                    PlanId = p.PlanId,
                    ThemeId = p.ThemeId,
                    Title = p.Title,
                    Summary = p.Summary,
                    PriorityScore = p.PriorityScore,
                    PriorityExplanation = p.PriorityExplanation,
                    Status = p.Status,
                    CreatedUtc = p.CreatedUtc,
                    ThemeEvidenceSignalCount = theme?.EvidenceSignalCount,
                };
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanListRecord>>(list);
    }

    public Task<IReadOnlyList<ProductLearningImprovementPlanRecord>> ListPlansForThemeAsync(
        Guid themeId,
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        List<ProductLearningImprovementPlanRecord> list = _plans
            .Where(p =>
                p.ThemeId == themeId &&
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId)
            .OrderByDescending(static p => p.CreatedUtc)
            .ThenBy(static p => p.PlanId)
            .Take(take)
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanRecord>>(list);
    }
}
