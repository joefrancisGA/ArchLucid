namespace ArchiForge.Decisioning.Advisory.Learning;

public sealed class AdaptiveRecommendationScorer : IAdaptiveRecommendationScorer
{
    public AdaptiveScoringResult Score(
        AdaptiveScoringInput input,
        RecommendationLearningProfile? profile)
    {
        var result = new AdaptiveScoringResult
        {
            BasePriorityScore = input.BasePriorityScore,
            AdaptedPriorityScore = input.BasePriorityScore,
            CategoryWeight = 1.0,
            UrgencyWeight = 1.0,
            SignalTypeWeight = 1.0
        };

        if (profile is null)
        {
            result.Notes.Add("No learning profile was available. Base score was used.");
            return result;
        }

        if (profile.CategoryWeights.TryGetValue(input.Category, out var categoryWeight))
        {
            result.CategoryWeight = categoryWeight;
            result.Notes.Add($"Applied category weight for {input.Category}: {categoryWeight:0.00}");
        }

        if (profile.UrgencyWeights.TryGetValue(input.Urgency, out var urgencyWeight))
        {
            result.UrgencyWeight = urgencyWeight;
            result.Notes.Add($"Applied urgency weight for {input.Urgency}: {urgencyWeight:0.00}");
        }

        if (!string.IsNullOrWhiteSpace(input.SignalType) &&
            profile.SignalTypeWeights.TryGetValue(input.SignalType!, out var signalWeight))
        {
            result.SignalTypeWeight = signalWeight;
            result.Notes.Add($"Applied signal-type weight for {input.SignalType}: {signalWeight:0.00}");
        }

        var weighted = input.BasePriorityScore
            * result.CategoryWeight
            * result.UrgencyWeight
            * result.SignalTypeWeight;

        result.AdaptedPriorityScore = (int)Math.Round(weighted, MidpointRounding.AwayFromZero);
        return result;
    }
}
