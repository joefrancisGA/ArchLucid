namespace ArchLucid.Decisioning.Findings;

/// <summary>Shared measurement-floor copy for run detail, finalize scorecard, and career exports (PC-01).</summary>
public static class InsightDensityMeasurementFloorPresenter
{
    /// <summary>Minimum measured engines before Working career exports proceed without an explicit incomplete confirmation.</summary>
    public const int CareerExportMeasurementFloorMinEngines =
        InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount;

    public static InsightDensityMeasurementFloorPresentation Present(int? measuredEnginesSucceeded)
    {
        int catalog = InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount;
        int harness = InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount;
        int? measured = NormalizeMeasuredCount(measuredEnginesSucceeded);
        bool meetsFloor = measured is not null && measured.Value >= CareerExportMeasurementFloorMinEngines;

        return new InsightDensityMeasurementFloorPresentation
        {
            CatalogEngineCount = catalog,
            MeasuredThisRunEngineCount = measured,
            HarnessEngineCount = harness,
            Sentence = BuildSentence(measured, catalog, harness),
            MeetsCareerExportFloor = meetsFloor,
        };
    }

    private static int? NormalizeMeasuredCount(int? measuredEnginesSucceeded)
    {
        if (measuredEnginesSucceeded is null)
        {
            return null;
        }

        if (measuredEnginesSucceeded.Value < 0)
        {
            return 0;
        }

        return measuredEnginesSucceeded.Value;
    }

    /// <summary>Null when the measured engine count meets the career export floor; otherwise a gate reason for Working exports.</summary>
    public static string? FormatCareerExportBlockedReason(
        int? measuredEnginesSucceeded,
        int catalogAdvisoryEngineFailureCount = 0)
    {
        if (catalogAdvisoryEngineFailureCount > 0)
        {
            return catalogAdvisoryEngineFailureCount == 1
                ? "1 catalog engine failed or did not run — career export requires typed findings from every catalog engine that executed."
                : $"{catalogAdvisoryEngineFailureCount} catalog engines failed or did not run — career export requires complete typed-engine coverage for this package.";
        }

        InsightDensityMeasurementFloorPresentation presentation = Present(measuredEnginesSucceeded);

        if (presentation.MeetsCareerExportFloor)
        {
            return null;
        }

        if (presentation.MeasuredThisRunEngineCount is null)
        {
            return
                $"Engine coverage has not been measured on this package — career export requires at least {presentation.HarnessEngineCount} catalog engines to produce findings.";
        }

        int measured = presentation.MeasuredThisRunEngineCount.Value;

        return
            $"Only {measured} of {presentation.CatalogEngineCount} catalog engines produced findings — below the {presentation.HarnessEngineCount}-engine measurement floor for career export.";
    }

    private static string BuildSentence(int? measured, int catalog, int harness)
    {
        if (measured is null)
        {
            return
                $"This run has no measured engine coverage yet. The product catalog includes {catalog} built-in engines; CI proves {harness} in the golden corpus harness.";
        }

        if (measured.Value < harness)
        {
            return
                $"{measured.Value} of {catalog} catalog engines produced findings on this package; the golden corpus harness proves {harness}. The sealed record may be honest but analytically incomplete.";
        }

        return
            $"{measured.Value} of {catalog} catalog engines produced findings on this package; the golden corpus harness proves {harness}.";
    }
}
