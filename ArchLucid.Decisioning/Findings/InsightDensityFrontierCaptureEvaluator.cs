namespace ArchLucid.Decisioning.Findings;

/// <summary>Evaluates frontier capture fixtures against the frontier-delta calculator (DX-20, DX-54).</summary>
public static class InsightDensityFrontierCaptureEvaluator
{
    public static FrontierDeltaSignal Evaluate(
        InsightDensityFrontierCaptureFixture fixture,
        double matchSimilarityThreshold = InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        List<FrontierBaselineFinding> baseline = InsightDensityFrontierCaptureLoader.BuildBaseline(fixture);

        return InsightDensityFrontierDeltaCalculator.Calculate(
            InsightDensityFrontierCaptureLoader.BuildFindingsSnapshot(fixture),
            baseline,
            matchSimilarityThreshold);
    }

    public static bool IsIdlePilotPending(InsightDensityFrontierCaptureFixture fixture)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        if (!string.Equals(fixture.Label, "pilot-pending", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (fixture.FrontierBaseline.Source != FrontierBaselineSource.Empty)
        {
            return false;
        }

        return fixture.FrontierBaseline.Findings.Count == 0;
    }

    public static bool MatchesExpectedNovelty(
        InsightDensityFrontierCaptureFixture fixture,
        double matchSimilarityThreshold = InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold,
        double maxDeviation = InsightDensityFrontierCaptureFixture.MaxExpectedNoveltyDeviation)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        if (IsIdlePilotPending(fixture))
        {
            return true;
        }

        if (!fixture.ExpectedNoveltyPercentage.HasValue)
        {
            return false;
        }

        FrontierDeltaSignal signal = Evaluate(fixture, matchSimilarityThreshold);

        return Math.Abs(signal.NoveltyPercentage - fixture.ExpectedNoveltyPercentage.Value) <= maxDeviation;
    }

    public static bool PassesCaptureValidation(
        InsightDensityFrontierCaptureFixture fixture,
        double matchSimilarityThreshold = InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold,
        double maxDeviation = InsightDensityFrontierCaptureFixture.MaxExpectedNoveltyDeviation)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        if (IsIdlePilotPending(fixture))
        {
            return true;
        }

        if (string.Equals(fixture.Label, "synthetic", StringComparison.OrdinalIgnoreCase))
        {
            return MatchesExpectedNovelty(fixture, matchSimilarityThreshold, maxDeviation);
        }

        if (fixture.ExpectedNoveltyPercentage.HasValue)
        {
            return MatchesExpectedNovelty(fixture, matchSimilarityThreshold, maxDeviation);
        }

        return true;
    }
}
