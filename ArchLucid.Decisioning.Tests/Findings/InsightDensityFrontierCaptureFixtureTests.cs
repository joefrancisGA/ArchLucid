using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class InsightDensityFrontierCaptureFixtureTests
{
    private static readonly string SyntheticFixturePath = Path.Combine(
        RepoRoot(),
        "tests",
        "eval-corpus",
        "insight-density-frontier-capture",
        "synthetic-highly-novel.json");

    private static readonly string PilotPendingIdleFixturePath = Path.Combine(
        RepoRoot(),
        "tests",
        "eval-corpus",
        "insight-density-frontier-capture",
        "pilot-pending-idle.json");

    [Fact]
    public void Synthetic_fixture_matches_expected_novelty_within_threshold()
    {
        InsightDensityFrontierCaptureFixture fixture = InsightDensityFrontierCaptureLoader.LoadFromFile(SyntheticFixturePath);

        fixture.Label.Should().Be("synthetic");
        fixture.FrontierBaseline.Source.Should().Be(FrontierBaselineSource.HumanAuthored);
        fixture.DecisionGradeFindingTitles.Should().HaveCount(4);
        fixture.NoveltyFindingIds.Should().Contain(["f1", "f2", "f4"]);

        FrontierDeltaSignal signal = InsightDensityFrontierCaptureEvaluator.Evaluate(fixture);

        signal.TotalFindingCount.Should().Be(4);
        signal.NovelFindingCount.Should().Be(3);
        signal.NoveltyPercentage.Should().Be(75.0);
        InsightDensityFrontierCaptureEvaluator.MatchesExpectedNovelty(fixture).Should().BeTrue();
        InsightDensityFrontierCaptureEvaluator.PassesCaptureValidation(fixture).Should().BeTrue();
    }

    [Fact]
    public void Pilot_pending_idle_fixture_passes_without_expected_novelty()
    {
        InsightDensityFrontierCaptureFixture fixture = InsightDensityFrontierCaptureLoader.LoadFromFile(PilotPendingIdleFixturePath);

        fixture.Label.Should().Be("pilot-pending");
        fixture.FrontierBaseline.Source.Should().Be(FrontierBaselineSource.Empty);
        fixture.ExpectedNoveltyPercentage.Should().BeNull();
        InsightDensityFrontierCaptureEvaluator.IsIdlePilotPending(fixture).Should().BeTrue();

        FrontierDeltaSignal signal = InsightDensityFrontierCaptureEvaluator.Evaluate(fixture);

        signal.TotalFindingCount.Should().Be(1);
        signal.NovelFindingCount.Should().Be(1);
        signal.NoveltyPercentage.Should().Be(100.0);
        InsightDensityFrontierCaptureEvaluator.MatchesExpectedNovelty(fixture).Should().BeTrue();
        InsightDensityFrontierCaptureEvaluator.PassesCaptureValidation(fixture).Should().BeTrue();
    }

    [Theory]
    [InlineData("human-authored", FrontierBaselineSource.HumanAuthored)]
    [InlineData("pilot-pending", FrontierBaselineSource.PilotPending)]
    [InlineData("empty", FrontierBaselineSource.Empty)]
    public void LoadFromJson_parses_frontier_baseline_source(string token, FrontierBaselineSource expected)
    {
        string json = $$"""
                          {
                            "schema": "archlucid.insight-density-frontier-capture.v1",
                            "architecturePackageSha256": "0000000000000000000000000000000000000000000000000000000000000001",
                            "findingsSnapshotId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                            "capturedUtc": "2026-09-07T00:00:00Z",
                            "label": "pilot-pending",
                            "decisionGradeFindingTitles": [],
                            "archlucidFindings": [],
                            "frontierBaseline": { "source": "{{token}}", "findings": [] }
                          }
                          """;

        InsightDensityFrontierCaptureFixture fixture = InsightDensityFrontierCaptureLoader.LoadFromJson(json);

        fixture.FrontierBaseline.Source.Should().Be(expected);
    }

    [Fact]
    public void LoadFromFile_rejects_unexpected_schema()
    {
        const string json = """
                              {
                                "schema": "wrong.schema.v1",
                                "architecturePackageSha256": "0000000000000000000000000000000000000000000000000000000000000001",
                                "findingsSnapshotId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                "capturedUtc": "2026-09-07T00:00:00Z",
                                "label": "synthetic",
                                "decisionGradeFindingTitles": [],
                                "archlucidFindings": [],
                                "frontierBaseline": { "source": "empty", "findings": [] },
                                "expectedNoveltyPercentage": 0.0
                              }
                              """;

        Action act = () => InsightDensityFrontierCaptureLoader.LoadFromJson(json);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Unexpected frontier capture schema*");
    }

    [Fact]
    public void LoadFromJson_rejects_empty_source_with_non_empty_findings()
    {
        const string json = """
                              {
                                "schema": "archlucid.insight-density-frontier-capture.v1",
                                "architecturePackageSha256": "0000000000000000000000000000000000000000000000000000000000000001",
                                "findingsSnapshotId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                "capturedUtc": "2026-09-07T00:00:00Z",
                                "label": "synthetic",
                                "decisionGradeFindingTitles": ["Title"],
                                "archlucidFindings": [],
                                "frontierBaseline": {
                                  "source": "empty",
                                  "findings": [
                                    { "category": "Security", "title": "Title", "ruleId": null }
                                  ]
                                },
                                "expectedNoveltyPercentage": 100.0
                              }
                              """;

        Action act = () => InsightDensityFrontierCaptureLoader.LoadFromJson(json);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*frontierBaseline.source=empty requires an empty findings array*");
    }

    private static string RepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root from test working directory.");
    }
}
