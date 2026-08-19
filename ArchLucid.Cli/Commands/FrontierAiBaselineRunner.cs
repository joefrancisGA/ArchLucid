using System.Globalization;

namespace ArchLucid.Cli.Commands;

internal sealed class FrontierAiBaselineRunner
{
    private const int MinSessionsForMessaging = 3;

    private static readonly string[] RequiredFixtureRelativePaths =
    [
        Path.Combine("fixtures", "bakeoff", "frontier-ai-scoreboard.template.md"),
        Path.Combine("fixtures", "bakeoff", "session-template", "README.md"),
        Path.Combine("docs", "go-to-market", "FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md"),
        Path.Combine("docs", "runbooks", "PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md"),
    ];

    internal FrontierAiBaselineReport Run(string repositoryRoot, FrontierAiBaselineOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);

        if (options is null)
            throw new ArgumentNullException(nameof(options));

        string scoreboardPath = ResolveScoreboardPath(repositoryRoot, options.ScoreboardPath);

        if (options.InitScoreboard)
            InitializeScoreboard(repositoryRoot, scoreboardPath);

        List<FrontierAiBaselineCheckResult> checks = new();
        checks.Add(BuildFixturePackCheck(repositoryRoot));
        checks.Add(BuildScoreboardPresenceCheck(scoreboardPath));

        IReadOnlyList<FrontierAiScoreboardSessionRow> sessions = Array.Empty<FrontierAiScoreboardSessionRow>();
        FrontierAiBaselineCohortMetrics? cohortMetrics = null;

        if (File.Exists(scoreboardPath))
        {
            string markdown = File.ReadAllText(scoreboardPath);
            sessions = FrontierAiScoreboardParser.ParseSessions(markdown);
            checks.Add(BuildAntiClaimsCheck(sessions));
            checks.Add(BuildSessionVolumeCheck(sessions));

            if (sessions.Count >= MinSessionsForMessaging)
            {
                cohortMetrics = BuildCohortMetrics(sessions);
                checks.Add(BuildCohortGuardrailsCheck(cohortMetrics));
            }
        }

        FrontierAiBaselineVerdict overallVerdict = DeriveOverallVerdict(checks);

        return new FrontierAiBaselineReport
        {
            RepositoryRoot = repositoryRoot,
            ScoreboardPath = scoreboardPath,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            Checks = checks,
            Sessions = sessions,
            CohortMetrics = cohortMetrics,
        };
    }

    private static string ResolveScoreboardPath(string repositoryRoot, string? scoreboardPath)
    {
        if (!string.IsNullOrWhiteSpace(scoreboardPath))
            return Path.GetFullPath(scoreboardPath);

        return Path.Combine(repositoryRoot, "artifacts", "bakeoff", "scoreboard", "frontier-ai-scoreboard.md");
    }

    private static void InitializeScoreboard(string repositoryRoot, string scoreboardPath)
    {
        string templatePath = Path.Combine(repositoryRoot, "fixtures", "bakeoff", "frontier-ai-scoreboard.template.md");

        if (!File.Exists(templatePath))
            throw new FileNotFoundException("Scoreboard template not found.", templatePath);

        string? directory = Path.GetDirectoryName(scoreboardPath);

        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        File.Copy(templatePath, scoreboardPath, overwrite: false);
    }

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

    private static FrontierAiBaselineCheckResult BuildAntiClaimsCheck(IReadOnlyList<FrontierAiScoreboardSessionRow> sessions)
    {
        int blockedRows = sessions.Count(static session => !session.AntiClaimsOk);

        if (blockedRows == 0)
        {
            return new FrontierAiBaselineCheckResult
            {
                Name = "Anti-claims audit",
                Verdict = FrontierAiBaselineVerdict.Pass,
                Evidence = sessions.Count == 0
                    ? "No logged sessions yet; anti-claims guard is ready."
                    : $"All {sessions.Count} logged sessions are marked anti-claims OK.",
            };
        }

        return new FrontierAiBaselineCheckResult
        {
            Name = "Anti-claims audit",
            Verdict = FrontierAiBaselineVerdict.Fail,
            Evidence = $"{blockedRows} session row(s) have Anti-claims OK = N.",
            Resolution = "Fix claim language or mark rows as internal-only until anti-claims pass.",
        };
    }

    private static FrontierAiBaselineCheckResult BuildSessionVolumeCheck(IReadOnlyList<FrontierAiScoreboardSessionRow> sessions)
    {
        if (sessions.Count >= MinSessionsForMessaging)
        {
            return new FrontierAiBaselineCheckResult
            {
                Name = "Session volume",
                Verdict = FrontierAiBaselineVerdict.Pass,
                Evidence = $"{sessions.Count} sessions logged (>= {MinSessionsForMessaging}).",
            };
        }

        return new FrontierAiBaselineCheckResult
        {
            Name = "Session volume",
            Verdict = FrontierAiBaselineVerdict.Warn,
            Evidence = $"{sessions.Count} sessions logged (< {MinSessionsForMessaging}).",
            Resolution = "Run monthly bakeoff sessions and append rows before strengthening external differentiation claims.",
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

    private static FrontierAiBaselineCohortMetrics BuildCohortMetrics(IReadOnlyList<FrontierAiScoreboardSessionRow> sessions)
    {
        int decisionChangeSessions = sessions.Count(static session => session.DecisionChangeCount >= 1);
        int passSessions = sessions.Count(static session =>
            string.Equals(session.DecisionDeltaOutcome, "PASS", StringComparison.OrdinalIgnoreCase));
        int measuredArchLucidRows = sessions.Count(static session =>
            string.Equals(session.TimingBasis, "measured", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(session.ArchLucidMinutes, "unknown", StringComparison.OrdinalIgnoreCase));
        int measuredManualRows = sessions.Count(static session =>
            string.Equals(session.TimingBasis, "measured", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(session.ManualMinutes, "unknown", StringComparison.OrdinalIgnoreCase));

        List<int> repeatScores = sessions
            .Where(static session => session.RepeatUseIntent >= 1 && session.RepeatUseIntent <= 5)
            .Select(static session => session.RepeatUseIntent)
            .OrderBy(static score => score)
            .ToList();

        double medianRepeat = 0;

        if (repeatScores.Count > 0)
        {
            int middle = repeatScores.Count / 2;

            if (repeatScores.Count % 2 == 1)
                medianRepeat = repeatScores[middle];
            else
                medianRepeat = (repeatScores[middle - 1] + repeatScores[middle]) / 2.0;
        }

        string topLossMode = sessions
            .GroupBy(static session => session.LossMode, StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(static group => group.Count())
            .ThenBy(static group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static group => group.Key)
            .FirstOrDefault() ?? "none";

        double sessionCount = sessions.Count;

        return new FrontierAiBaselineCohortMetrics
        {
            SessionCount = sessions.Count,
            MeasuredArchLucidTimingRows = measuredArchLucidRows,
            MeasuredManualTimingRows = measuredManualRows,
            DecisionChangeRate = sessionCount <= 0 ? 0 : decisionChangeSessions / sessionCount,
            DecisionDeltaPassRate = sessionCount <= 0 ? 0 : passSessions / sessionCount,
            MedianRepeatUseIntent = medianRepeat,
            TopLossMode = topLossMode,
            MessagingReady = sessions.Count >= MinSessionsForMessaging,
        };
    }

    private static FrontierAiBaselineVerdict DeriveOverallVerdict(IReadOnlyList<FrontierAiBaselineCheckResult> checks)
    {
        if (checks.Any(static check => check.Verdict == FrontierAiBaselineVerdict.Fail))
            return FrontierAiBaselineVerdict.Fail;

        if (checks.Any(static check => check.Verdict == FrontierAiBaselineVerdict.Warn))
            return FrontierAiBaselineVerdict.Warn;

        return FrontierAiBaselineVerdict.Pass;
    }
}
