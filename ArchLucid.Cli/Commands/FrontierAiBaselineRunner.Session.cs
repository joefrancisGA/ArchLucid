namespace ArchLucid.Cli.Commands;

internal sealed partial class FrontierAiBaselineRunner
{
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
}
