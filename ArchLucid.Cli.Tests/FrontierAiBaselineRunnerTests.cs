using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FrontierAiBaselineRunnerTests
{
    [Fact]
    public void Run_WithFixturesAndNoScoreboard_WarnsOnInitialization()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures();

        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(
            repo.Root,
            new FrontierAiBaselineOptions());

        report.OverallVerdict.Should().Be(FrontierAiBaselineVerdict.Warn);
        report.Checks.Should().Contain(static check =>
            check.Name == "Scoreboard initialized" && check.Verdict == FrontierAiBaselineVerdict.Warn);
    }

    [Fact]
    public void Run_WithInitializedScoreboardAndThreeSessions_PassesGuardrailsWhenHealthy()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures(includeScoreboard: true);

        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(
            repo.Root,
            new FrontierAiBaselineOptions { ScoreboardPath = repo.ScoreboardPath });

        report.OverallVerdict.Should().Be(FrontierAiBaselineVerdict.Pass);
        report.Sessions.Should().HaveCount(3);
        report.CohortMetrics.Should().NotBeNull();
        report.CohortMetrics!.DecisionChangeRate.Should().BeGreaterThan(0.5);
        report.CohortMetrics.DecisionDeltaPassRate.Should().BeGreaterThan(0.5);
    }

    [Fact]
    public void Run_WithAntiClaimsFailure_FailsOverall()
    {
        using TempRepoFixture repo = TempRepoFixture.CreateWithFixtures(includeScoreboard: true, antiClaimsOk: false);

        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(
            repo.Root,
            new FrontierAiBaselineOptions { ScoreboardPath = repo.ScoreboardPath });

        report.OverallVerdict.Should().Be(FrontierAiBaselineVerdict.Fail);
        report.Checks.Should().Contain(static check =>
            check.Name == "Anti-claims audit" && check.Verdict == FrontierAiBaselineVerdict.Fail);
    }

    private sealed class TempRepoFixture : IDisposable
    {
        public string Root { get; }

        public string ScoreboardPath { get; }

        private TempRepoFixture(string root, string scoreboardPath)
        {
            Root = root;
            ScoreboardPath = scoreboardPath;
        }

        public static TempRepoFixture CreateWithFixtures(bool includeScoreboard = false, bool antiClaimsOk = true)
        {
            string root = Path.Combine(Path.GetTempPath(), "archlucid-frontier-baseline-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);

            WriteFile(root, Path.Combine("docs", "go-to-market", "AZURE_MARKETPLACE_SAAS_OFFER.md"), "# marker");
            WriteFile(root, Path.Combine("fixtures", "bakeoff", "frontier-ai-scoreboard.template.md"), "# template");
            WriteFile(root, Path.Combine("fixtures", "bakeoff", "session-template", "README.md"), "# session template");
            WriteFile(
                root,
                Path.Combine("docs", "go-to-market", "FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md"),
                "# scoreboard guide");
            WriteFile(
                root,
                Path.Combine("docs", "runbooks", "PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md"),
                "# runbook");

            string scoreboardPath = Path.Combine(root, "artifacts", "bakeoff", "scoreboard", "frontier-ai-scoreboard.md");

            if (includeScoreboard)
            {
                string antiClaims = antiClaimsOk ? "Y" : "N";
                string markdown = $$"""
                    ## Session log

                    | Session | Date (UTC) | Packet | Exec mode | AL min | Manual min | Timing basis | Decision Δ count | Δ outcome | Repeat (1–5) | Loss mode | AL win | Anti-claims OK |
                    | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
                    | session-a | 2026-06-01 | packet-a | Real | 40 | 30 | measured | 1 | PASS | 4 | none | traceability | {{antiClaims}} |
                    | session-b | 2026-06-02 | packet-b | Real | 45 | 33 | measured | 2 | PASS | 5 | L7 | packaging | {{antiClaims}} |
                    | session-c | 2026-06-03 | packet-c | Real | 38 | 36 | measured | 1 | WARN | 3 | none | repeatability | {{antiClaims}} |
                    """;

                WriteFile(root, scoreboardPath, markdown);
            }

            return new TempRepoFixture(root, scoreboardPath);
        }

        private static void WriteFile(string root, string relativePath, string contents)
        {
            string absolutePath = Path.Combine(root, relativePath);
            string? directory = Path.GetDirectoryName(absolutePath);

            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(absolutePath, contents);
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
                Directory.Delete(Root, recursive: true);
        }
    }
}
