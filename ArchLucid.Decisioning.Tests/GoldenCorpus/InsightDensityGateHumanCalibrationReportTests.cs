using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Aggregates gate vs human novelty calibration across golden corpus cases (DX-67).</summary>
[Trait("Category", "GoldenCorpusRecord")]
public sealed class InsightDensityGateHumanCalibrationReportTests
{
    [Fact]
    public async Task Calculator_runs_for_every_case_without_novelty_rates()
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
            GraphSnapshot graph = input!.GraphSnapshot;

            FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
                graph.RunId,
                graph.ContextSnapshotId,
                graph,
                CancellationToken.None,
                input.InventoryFixture,
                input.PriorGraphFixture);

            IReadOnlyList<InsightDensityGateHumanCalibrationRow> rows =
                InsightDensityGateHumanCalibrationCalculator.Calculate(snapshot, gate, options, noveltyRates: null);

            HashSet<string> engineTypesInSnapshot = snapshot.Findings
                .Select(static finding => finding.EngineType)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            HashSet<string> engineTypesInCalibration = rows
                .Select(static row => row.EngineType)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            engineTypesInCalibration.Should().BeEquivalentTo(engineTypesInSnapshot);

            foreach (InsightDensityGateHumanCalibrationRow row in rows)
            {
                row.NoveltyRate.Should().BeNull("golden corpus has no tenant novelty signals");
                row.Residual.Should().BeNull("residual requires novelty rate at sample floor");
            }
        }
    }

    /// <summary>
    /// Set <c>ARCHLUCID_RECORD_INSIGHT_DENSITY_GATE_HUMAN_CALIBRATION=1</c> to rewrite
    /// <c>docs/quality/insight-density-gate-human-calibration.md</c>.
    /// </summary>
    [Fact]
    public async Task Record_calibration_markdown_when_env_flag_set()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("ARCHLUCID_RECORD_INSIGHT_DENSITY_GATE_HUMAN_CALIBRATION"),
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

        Dictionary<string, InsightDensityGateHumanCalibrationRow> mergedRows =
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
                input.InventoryFixture,
                input.PriorGraphFixture);

            IReadOnlyList<InsightDensityGateHumanCalibrationRow> rows =
                InsightDensityGateHumanCalibrationCalculator.Calculate(snapshot, gate, options, noveltyRates: null);

            foreach (InsightDensityGateHumanCalibrationRow row in rows)
            {
                if (!mergedRows.TryGetValue(row.EngineType, out InsightDensityGateHumanCalibrationRow? existing))
                {
                    mergedRows[row.EngineType] = new InsightDensityGateHumanCalibrationRow
                    {
                        EngineType = row.EngineType,
                        FindingCount = row.FindingCount,
                        DecisionGradeCount = row.DecisionGradeCount,
                        MedianScore = row.MedianScore,
                        DidNotThinkOfThatCount = row.DidNotThinkOfThatCount,
                        NoveltyRate = row.NoveltyRate,
                        Residual = row.Residual,
                    };

                    continue;
                }

                existing.FindingCount += row.FindingCount;
                existing.DecisionGradeCount += row.DecisionGradeCount;
                existing.DidNotThinkOfThatCount += row.DidNotThinkOfThatCount;
                existing.MedianScore = row.FindingCount >= existing.FindingCount
                    ? row.MedianScore
                    : existing.MedianScore;
            }
        }

        List<InsightDensityGateHumanCalibrationRow> rollupRows = mergedRows.Values
            .OrderBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToList();

        string markdownPath = Path.Combine(
            GoldenCorpusRepoPaths.FindRepoRoot(),
            "docs",
            "quality",
            "insight-density-gate-human-calibration.md");

        await File.WriteAllTextAsync(markdownPath, InsightDensityGateHumanCalibrationMarkdown.Write(rollupRows));
    }
}
