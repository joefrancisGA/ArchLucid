namespace ArchLucid.Decisioning.Findings;

/// <summary>Shared measurement-floor copy for run detail, finalize scorecard, and career exports (PC-01 / DX-15).</summary>
public static class InsightDensityMeasurementFloorPresenter
{
    /// <summary>Minimum measured engines before Working career exports proceed without an explicit incomplete confirmation.</summary>
    public static int CareerExportMeasurementFloorMinEngines =>
        GoldenCorpusHarnessEngineRegistration.RegisteredEngineCount;

    public static InsightDensityMeasurementFloorPresentation Present(int? measuredEnginesSucceeded) =>
        Present(measuredEnginesSucceeded, context: null);

    public static InsightDensityMeasurementFloorPresentation Present(
        int? measuredEnginesSucceeded,
        InsightDensityMeasurementFloorContext? context)
    {
        int catalog = InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount;
        int harness = InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount;
        int? measured = NormalizeMeasuredCount(measuredEnginesSucceeded);
        bool meetsFloor = measured is not null && measured.Value >= CareerExportMeasurementFloorMinEngines;
        IReadOnlyList<string> skippedActorEngineTypes = ResolveSkippedActorEngineTypes(context);
        int? judgeSkippedByCap = NormalizeJudgeSkippedByCap(context?.JudgeSkippedByCap);

        return new InsightDensityMeasurementFloorPresentation
        {
            CatalogEngineCount = catalog,
            MeasuredThisRunEngineCount = measured,
            HarnessEngineCount = harness,
            Sentence = BuildSentence(measured, catalog, harness, skippedActorEngineTypes, judgeSkippedByCap),
            MeetsCareerExportFloor = meetsFloor,
            SkippedActorEngineTypes = skippedActorEngineTypes,
            JudgeSkippedByCap = judgeSkippedByCap,
        };
    }

    private static IReadOnlyList<string> ResolveSkippedActorEngineTypes(InsightDensityMeasurementFloorContext? context)
    {
        if (context is null)
        {
            return [];
        }

        return InsightDensityMeasurementFloorContext.DeriveSkippedActorEngineTypes(
            context.ActorNodeCount,
            context.AnalysisStagesComplete);
    }

    private static int? NormalizeJudgeSkippedByCap(int? judgeSkippedByCap)
    {
        if (judgeSkippedByCap is null or <= 0)
        {
            return null;
        }

        return judgeSkippedByCap.Value;
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

    private static string BuildSentence(
        int? measured,
        int catalog,
        int harness,
        IReadOnlyList<string> skippedActorEngineTypes,
        int? judgeSkippedByCap)
    {
        string baseSentence;

        if (measured is null)
        {
            baseSentence =
                $"This run has no measured engine coverage yet. The product catalog includes {catalog} built-in engines; CI proves {harness} in the golden corpus harness.";
        }
        else if (measured.Value < harness)
        {
            baseSentence =
                $"{measured.Value} of {catalog} catalog engines produced findings on this package; the golden corpus harness proves {harness}. The sealed record may be honest but analytically incomplete.";
        }
        else
        {
            baseSentence =
                $"{measured.Value} of {catalog} catalog engines produced findings on this package; the golden corpus harness proves {harness}.";
        }

        return AppendHonestySuffixes(baseSentence, skippedActorEngineTypes, judgeSkippedByCap);
    }

    private static string AppendHonestySuffixes(
        string baseSentence,
        IReadOnlyList<string> skippedActorEngineTypes,
        int? judgeSkippedByCap)
    {
        List<string> suffixes = [];

        if (skippedActorEngineTypes.Count > 0)
        {
            suffixes.Add(
                $"Skipped actor-dependent engines ({string.Join(", ", skippedActorEngineTypes)}) — this graph has no Actor nodes.");
        }

        if (judgeSkippedByCap is > 0)
        {
            suffixes.Add(
                judgeSkippedByCap.Value == 1
                    ? "Premium insight-density judge skipped 1 finding by per-snapshot cap."
                    : $"Premium insight-density judge skipped {judgeSkippedByCap.Value} findings by per-snapshot cap.");
        }

        if (suffixes.Count == 0)
        {
            return baseSentence;
        }

        return $"{baseSentence} {string.Join(" ", suffixes)}";
    }
}
