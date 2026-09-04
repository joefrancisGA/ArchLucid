namespace ArchLucid.Cli.Commands;

internal sealed partial class FrontierAiBaselineRunner
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
}
