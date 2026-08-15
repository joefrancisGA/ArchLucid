using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-2343 batch 49: minimum average recall on held-out extraction microcases (separate from review recall).
/// </summary>
public static class ArchitectureIntelligenceHeldOutExtractionPolicy
{
    public const double MinimumHeldOutAverageRecall = 0.25;

    public static double ComputeAverageRecall(IReadOnlyList<ExtractionFidelityScore> scores)
    {
        ArgumentNullException.ThrowIfNull(scores);

        if (scores.Count == 0)
        {
            return 0.0;
        }

        return scores.Average(score => score.Recall);
    }
}
