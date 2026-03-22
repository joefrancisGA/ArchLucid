using ArchiForge.Decisioning.Advisory.Learning;
using ArchiForge.Decisioning.Advisory.Models;

namespace ArchiForge.Decisioning.Advisory.Services;

public interface IRecommendationGenerator
{
    IReadOnlyList<ImprovementRecommendation> Generate(
        IReadOnlyList<ImprovementSignal> signals,
        RecommendationLearningProfile? profile = null);
}
