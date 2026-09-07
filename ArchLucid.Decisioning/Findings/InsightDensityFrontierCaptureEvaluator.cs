namespace ArchLucid.Decisioning.Findings;

/// <summary>Evaluates frontier capture fixtures against the frontier-delta calculator (DX-20).</summary>
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

    public static bool MatchesExpectedNovelty(
        InsightDensityFrontierCaptureFixture fixture,
        double matchSimilarityThreshold = InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold,
        double maxDeviation = InsightDensityFrontierCaptureFixture.MaxExpectedNoveltyDeviation)
    {
        FrontierDeltaSignal signal = Evaluate(fixture, matchSimilarityThreshold);

        return Math.Abs(signal.NoveltyPercentage - fixture.ExpectedNoveltyPercentage) <= maxDeviation;
    }
}
