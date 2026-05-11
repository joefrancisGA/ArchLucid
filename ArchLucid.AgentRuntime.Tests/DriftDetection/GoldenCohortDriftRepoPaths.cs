namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

internal static class GoldenCohortDriftRepoPaths
{
    internal static string ResolveGoldenCohortTestsDirectoryOnDisk()
    {
        string candidate =
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "tests", "golden-cohort"));

        string cohortMarker = Path.Combine(candidate, "cohort.json");

        if (!File.Exists(cohortMarker))

            throw new InvalidOperationException(
                $"Could not resolve tests/golden-cohort from test bin (missing marker file '{cohortMarker}').");

        return candidate;
    }

    internal static string ResolveDriftReportsDirectory()
    {
        return Path.Combine(ResolveGoldenCohortTestsDirectoryOnDisk(), "drift-reports");
    }

    internal static string ResolveDriftTrendLogPath()
    {
        return Path.Combine(ResolveGoldenCohortTestsDirectoryOnDisk(), "drift-trend.jsonl");
    }

    internal static string ResolveDriftSummaryMarkdownPath()
    {
        return Path.Combine(ResolveGoldenCohortTestsDirectoryOnDisk(), "DRIFT_SUMMARY.md");
    }
}
