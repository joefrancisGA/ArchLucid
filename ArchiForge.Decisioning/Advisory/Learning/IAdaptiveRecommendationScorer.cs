namespace ArchiForge.Decisioning.Advisory.Learning;

public interface IAdaptiveRecommendationScorer
{
    AdaptiveScoringResult Score(
        AdaptiveScoringInput input,
        RecommendationLearningProfile? profile);
}
