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

    [Fact]
    public void Synthetic_fixture_matches_expected_novelty_within_threshold()
    {
        InsightDensityFrontierCaptureFixture fixture = InsightDensityFrontierCaptureLoader.LoadFromFile(SyntheticFixturePath);

        fixture.Label.Should().Be("synthetic");
        fixture.DecisionGradeFindingTitles.Should().HaveCount(4);
        fixture.NoveltyFindingIds.Should().Contain(["f1", "f2", "f4"]);

        FrontierDeltaSignal signal = InsightDensityFrontierCaptureEvaluator.Evaluate(fixture);

        signal.TotalFindingCount.Should().Be(4);
        signal.NovelFindingCount.Should().Be(3);
        signal.NoveltyPercentage.Should().Be(75.0);
        InsightDensityFrontierCaptureEvaluator.MatchesExpectedNovelty(fixture).Should().BeTrue();
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
                                "frontierBaseline": { "findings": [] },
                                "expectedNoveltyPercentage": 0.0
                              }
                              """;

        Action act = () => InsightDensityFrontierCaptureLoader.LoadFromJson(json);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Unexpected frontier capture schema*");
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
