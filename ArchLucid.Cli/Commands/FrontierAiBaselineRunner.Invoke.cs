using System.Globalization;

namespace ArchLucid.Cli.Commands;

internal sealed partial class FrontierAiBaselineRunner
{
    private static FrontierAiBaselineCheckResult BuildFixturePackCheck(string repositoryRoot)
    {
        List<string> missing = new();

        foreach (string relativePath in RequiredFixtureRelativePaths)
        {
            string absolutePath = Path.Combine(repositoryRoot, relativePath);

            if (!File.Exists(absolutePath))
                missing.Add(relativePath.Replace('\\', '/'));
        }

        if (missing.Count == 0)
        {
            return new FrontierAiBaselineCheckResult
            {
                Name = "Baseline fixture pack",
                Verdict = FrontierAiBaselineVerdict.Pass,
                Evidence = $"All {RequiredFixtureRelativePaths.Length} required frontier-AI benchmark assets are present.",
            };
        }

        return new FrontierAiBaselineCheckResult
        {
            Name = "Baseline fixture pack",
            Verdict = FrontierAiBaselineVerdict.Fail,
            Evidence = $"Missing benchmark assets: {string.Join(", ", missing)}.",
            Resolution = "Restore fixtures and docs from the repository before running frontier-AI baseline checks.",
        };
    }

    private static FrontierAiBaselineCheckResult BuildScoreboardPresenceCheck(string scoreboardPath)
    {
        if (File.Exists(scoreboardPath))
        {
            return new FrontierAiBaselineCheckResult
            {
                Name = "Scoreboard initialized",
                Verdict = FrontierAiBaselineVerdict.Pass,
                Evidence = $"Scoreboard file exists at {scoreboardPath}.",
            };
        }

        return new FrontierAiBaselineCheckResult
        {
            Name = "Scoreboard initialized",
            Verdict = FrontierAiBaselineVerdict.Warn,
            Evidence = "Scoreboard file is missing.",
            Resolution = "Run with --init-scoreboard to copy fixtures/bakeoff/frontier-ai-scoreboard.template.md.",
        };
    }

    private static FrontierAiBaselineCheckResult BuildCohortGuardrailsCheck(FrontierAiBaselineCohortMetrics metrics)
    {
        List<string> holds = new();

        if (metrics.DecisionChangeRate < 0.33)
            holds.Add("decision-change rate below 33% hold threshold");

        if (metrics.DecisionDeltaPassRate < 0.33)
            holds.Add("decision-delta PASS rate below 33% hold threshold");

        if (metrics.MedianRepeatUseIntent < 2.5)
            holds.Add("median repeat-use intent below 2.5 hold threshold");

        if (holds.Count == 0)
        {
            return new FrontierAiBaselineCheckResult
            {
                Name = "Cohort guardrails",
                Verdict = FrontierAiBaselineVerdict.Pass,
                Evidence =
                    $"Decision-change rate {metrics.DecisionChangeRate.ToString("P0", CultureInfo.InvariantCulture)}, " +
                    $"PASS rate {metrics.DecisionDeltaPassRate.ToString("P0", CultureInfo.InvariantCulture)}, " +
                    $"median repeat-use {metrics.MedianRepeatUseIntent.ToString("0.0", CultureInfo.InvariantCulture)}.",
            };
        }

        return new FrontierAiBaselineCheckResult
        {
            Name = "Cohort guardrails",
            Verdict = FrontierAiBaselineVerdict.Warn,
            Evidence = string.Join("; ", holds) + ".",
            Resolution = "Hold external superiority claims until the next bakeoff cohort improves guardrails.",
        };
    }
}
