namespace ArchLucid.Core.Findings;

/// <summary>Shared novelty-rate math for SQL and in-memory aggregators (DX-23).</summary>
public static class EngineInsightNoveltyRateCalculator
{
    public static double? ComputeRate(int decisionGradeCount, int didNotThinkOfThatCount)
    {
        if (decisionGradeCount <= 0)
        {
            return null;
        }

        return Math.Round((double)didNotThinkOfThatCount / decisionGradeCount, 4, MidpointRounding.AwayFromZero);
    }
}
