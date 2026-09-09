using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

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

        Dictionary<string, InsightDensityEngineDistributionAccumulator> accumulators =
            new(StringComparer.OrdinalIgnoreCase);

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

            List<InsightDensityGateCandidate> candidates = snapshot.Findings
                .Select(InsightDensityGateCandidate.FromFinding)
                .ToList();

            foreach (Finding finding in snapshot.Findings)
            {
                InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
                InsightDensityGateResult result = gate.Score(candidate, candidates);

                if (!accumulators.TryGetValue(finding.EngineType, out InsightDensityEngineDistributionAccumulator? accumulator))
                {
                    accumulator = new InsightDensityEngineDistributionAccumulator();
                    accumulators[finding.EngineType] = accumulator;
                }

                accumulator.AddFinding(result, candidate, options.DemotionThreshold);
            }
        }

        List<InsightDensityEngineDistributionRow> rollupRows = accumulators
            .Select(static pair => pair.Value.ToRow(pair.Key))
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
        markdown.Should().Contain("**42** engines");
        markdown.Should().Contain("registers **42** engines");
        markdown.Should().Contain("WouldDemoteIfUnprotectedCount");
        markdown.Should().Contain("matches production demotion");
        markdown.Should().Contain("WouldDemoteAt65Count");
        markdown.Should().Contain("production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59)");
    }
}
