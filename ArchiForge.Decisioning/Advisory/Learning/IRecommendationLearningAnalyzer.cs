using ArchiForge.Decisioning.Advisory.Workflow;

namespace ArchiForge.Decisioning.Advisory.Learning;

public interface IRecommendationLearningAnalyzer
{
    RecommendationLearningProfile BuildProfile(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<RecommendationRecord> recommendations);
}
