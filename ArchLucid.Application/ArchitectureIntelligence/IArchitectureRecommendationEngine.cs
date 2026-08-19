using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureRecommendationEngine
{
    IReadOnlyList<ArchitectureRecommendation> BuildRecommendations(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities);
}
