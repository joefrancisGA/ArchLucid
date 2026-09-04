using ArchLucid.Contracts.Alerts.Tuning;

namespace ArchLucid.Decisioning.Alerts.Tuning;

public sealed partial class ThresholdRecommendationService
{
    private static void RankRecommendedCandidate(ArchLucid.Contracts.Alerts.Tuning.ThresholdRecommendationResult result)
    {
        result.RecommendedCandidate = result.Candidates
            .OrderByDescending(x => x.ScoreBreakdown.FinalScore)
            .ThenByDescending(x => x.SimulationResult.MatchedCount)
            .FirstOrDefault();

        if (result.RecommendedCandidate is not null)
        {
            result.SummaryNotes.Add(
                $"Recommended threshold: {result.RecommendedCandidate.Candidate.ThresholdValue:0.##}");

            result.SummaryNotes.Add(
                "Recommended candidate would create " +
                $"{result.RecommendedCandidate.SimulationResult.WouldCreateCount} alert(s) " +
                $"and suppress {result.RecommendedCandidate.SimulationResult.WouldSuppressCount}.");
        }
        else if (result.Candidates.Count == 0)

            result.SummaryNotes.Add(
                "No candidates were evaluated. Check RuleKind, base rule, and candidate thresholds.");

        result.SummaryNotes.Add($"Evaluated {result.Candidates.Count} candidate threshold(s).");
    }
}
