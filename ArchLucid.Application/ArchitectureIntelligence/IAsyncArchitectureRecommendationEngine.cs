using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAsyncArchitectureRecommendationEngine
{
    Task<IReadOnlyList<ArchitectureRecommendation>> BuildRecommendationsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken = default);
}
