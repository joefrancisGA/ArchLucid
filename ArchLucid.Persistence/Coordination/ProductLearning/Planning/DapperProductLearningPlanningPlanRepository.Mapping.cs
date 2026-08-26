using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

internal sealed partial class DapperProductLearningPlanningPlanRepository
{
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
