using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Aggregates per-engine insight-density scores across golden corpus cases.</summary>
[Trait("Category", "GoldenCorpusRecord")]
public sealed class InsightDensityEngineDistributionReportTests
{
    [Fact]
    public async Task Calculator_runs_for_every_case_and_covers_all_engine_types()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        string root = GoldenCorpusRepoPaths.CorpusOutputDirectory;

        IInsightDensityGate gate = DeterministicInsightDensityGate.CreateDefault();
        InsightDensityGateOptions options = new();

        List<string> dirs = Directory.GetDirectories(root)
            .OrderBy(static d => d, StringComparer.OrdinalIgnoreCase)
            .ToList();

        dirs.Should().NotBeEmpty();

        foreach (string dir in dirs)
        {
            string inputPath = Path.Combine(dir, "input.json");
            File.Exists(inputPath).Should().BeTrue($"missing input.json in {dir}");

            string inputJson = await File.ReadAllTextAsync(inputPath);
            GoldenCorpusInputDocument? input =
                System.Text.Json.JsonSerializer.Deserialize<GoldenCorpusInputDocument>(
                    inputJson,
                    GoldenCorpusJson.SerializerOptions);

            input.Should().NotBeNull();
            GraphSnapshot graph = input.GraphSnapshot;

            FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
                graph.RunId,
                graph.ContextSnapshotId,
                graph,
                CancellationToken.None,
                input!.InventoryFixture);

            InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
                snapshot,
                gate,
                options);

            HashSet<string> engineTypesInSnapshot = snapshot.Findings
                .Select(static finding => finding.EngineType)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            HashSet<string> engineTypesInDistribution = distribution.Rows
                .Select(static row => row.EngineType)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            engineTypesInDistribution.Should().BeEquivalentTo(engineTypesInSnapshot);
        }
    }

    /// <summary>
    /// Set <c>ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1</c> to rewrite
    /// <c>docs/quality/insight-density-engine-distribution.md</c>.
    /// </summary>
    [Fact]
    public async Task Record_distribution_markdown_when_env_flag_set()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION"),
                "1",
                StringComparison.Ordinal))
        {
            return;
        }

        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        string root = GoldenCorpusRepoPaths.CorpusOutputDirectory;

        IInsightDensityGate gate = DeterministicInsightDensityGate.CreateDefault();
        InsightDensityGateOptions options = new();

        Dictionary<string, List<int>> aggregatedScores = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, int> wouldDemoteCounts = new(StringComparer.OrdinalIgnoreCase);

        foreach (string dir in Directory.GetDirectories(root).OrderBy(static d => d, StringComparer.OrdinalIgnoreCase))
        {
            string inputJson = await File.ReadAllTextAsync(Path.Combine(dir, "input.json"));
            GoldenCorpusInputDocument? input =
                System.Text.Json.JsonSerializer.Deserialize<GoldenCorpusInputDocument>(
                    inputJson,
                    GoldenCorpusJson.SerializerOptions);

            if (input is null)
            {
                continue;
            }

            GraphSnapshot graph = input.GraphSnapshot;
            FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
                graph.RunId,
                graph.ContextSnapshotId,
                graph,
                CancellationToken.None,
                input!.InventoryFixture);

            InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
                snapshot,
                gate,
                options);

            foreach (InsightDensityEngineDistributionRow row in distribution.Rows)
            {
                if (!aggregatedScores.TryGetValue(row.EngineType, out List<int>? bucket))
                {
                    bucket = [];
                    aggregatedScores[row.EngineType] = bucket;
                }

                List<InsightDensityGateCandidate> candidates = snapshot.Findings
                    .Select(InsightDensityGateCandidate.FromFinding)
                    .ToList();

                foreach (Finding finding in snapshot.Findings.Where(f => f.EngineType == row.EngineType))
                {
                    InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
                    int score = gate.Score(candidate, candidates).InsightDensityScore;
                    bucket.Add(score);

                    if (score < options.DemotionThreshold)
                    {
                        wouldDemoteCounts[row.EngineType] = wouldDemoteCounts.GetValueOrDefault(row.EngineType) + 1;
                    }
                }
            }
        }

        List<InsightDensityEngineDistributionRow> rollupRows = aggregatedScores
            .Select(pair =>
            {
                List<int> sorted = pair.Value.OrderBy(static score => score).ToList();
                int count = sorted.Count;
                int median = count % 2 == 1
                    ? sorted[count / 2]
                    : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;

                return new InsightDensityEngineDistributionRow
                {
                    EngineType = pair.Key,
                    FindingCount = count,
                    MinScore = sorted[0],
                    MedianScore = median,
                    MaxScore = sorted[count - 1],
                    WouldDemoteIfUnprotectedCount = wouldDemoteCounts.GetValueOrDefault(pair.Key),
                };
            })
            .OrderBy(static row => row.MedianScore)
            .ThenBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToList();

        string markdownPath = Path.Combine(
            GoldenCorpusRepoPaths.FindRepoRoot(),
            "docs",
            "quality",
            "insight-density-engine-distribution.md");

        await File.WriteAllTextAsync(markdownPath, InsightDensityEngineDistributionMarkdown.Build(rollupRows));
    }

    [Fact]
    public void Distribution_markdown_includes_claim_boundary_disclaimer()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            new InsightDensityEngineDistributionRow
            {
                EngineType = "compliance",
                FindingCount = 1,
                MinScore = 100,
                MedianScore = 100,
                MaxScore = 100,
                WouldDemoteIfUnprotectedCount = 0,
            },
        ]);

        markdown.Should().Contain(InsightDensityEngineDistributionMarkdown.ClaimBoundaryMarker);
        markdown.Should().Contain("typed-engine-scored");
        markdown.Should().Contain("**35** engines");
        markdown.Should().Contain("registers **35** engines");
        markdown.Should().Contain("WouldDemoteIfUnprotectedCount");
        markdown.Should().Contain("matches production demotion");
    }
}
