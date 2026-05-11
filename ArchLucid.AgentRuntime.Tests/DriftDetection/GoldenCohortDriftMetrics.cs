namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

internal static class GoldenCohortDriftMetrics
{
    /// <summary>One-half L1 distance between normalized severity histograms (in [0,1]).</summary>
    internal static double SeverityTotalVariation(GoldenCohortDriftFindingSummary sim, GoldenCohortDriftFindingSummary real)
    {
        HashSet<string> keys = new(StringComparer.Ordinal);

        foreach (string k in sim.SeverityCounts.Keys)
            keys.Add(k);

        foreach (string k in real.SeverityCounts.Keys)
            keys.Add(k);

        int simTotal = Math.Max(1, sim.FindingCount);
        int realTotal = Math.Max(1, real.FindingCount);
        double tv = 0d;

        foreach (string key in keys.Order(StringComparer.Ordinal))
        {
            sim.SeverityCounts.TryGetValue(key, out int sc);
            real.SeverityCounts.TryGetValue(key, out int rc);

            double ps = sc / (double)simTotal;
            double pr = rc / (double)realTotal;
            tv += Math.Abs(ps - pr);
        }

        return 0.5d * tv;
    }

    internal static double Jaccard(IReadOnlyList<string> a, IReadOnlyList<string> b)
    {
        HashSet<string> left = new(a, StringComparer.Ordinal);
        HashSet<string> right = new(b, StringComparer.Ordinal);

        if (left.Count == 0 && right.Count == 0)
            return 1d;

        int inter = left.Count(x => right.Contains(x));

        int union = left.Count + right.Count - inter;

        return union <= 0 ? 0d : inter / (double)union;
    }

    internal static GoldenCohortSimulatorVsRealDriftReport BuildReport(
        string scenarioId,
        string scenarioTitle,
        GoldenCohortDriftFindingSummary sim,
        GoldenCohortDriftFindingSummary real,
        int inputTok,
        int outputTok,
        string? realError)
    {
        double sevDiv = SeverityTotalVariation(sim, real);
        double titleJac = Jaccard(sim.NormalizedTitles, real.NormalizedTitles);
        double recJac = Jaccard(sim.NormalizedRecommendations, real.NormalizedRecommendations);

        return new GoldenCohortSimulatorVsRealDriftReport
        {
            ScenarioName = scenarioId,
            ScenarioTitle = scenarioTitle,
            TimestampUtc = DateTimeOffset.UtcNow,
            SimulatorFindings = sim,
            RealFindings = real,
            CountDelta = real.FindingCount - sim.FindingCount,
            SeverityDivergence = Math.Round(sevDiv, 6),
            TitleOverlap = Math.Round(titleJac, 6),
            RecommendationOverlap = Math.Round(recJac, 6),
            RealModeInputTokens = inputTok,
            RealModeOutputTokens = outputTok,
            RealExecutionError = realError,
        };
    }
}
