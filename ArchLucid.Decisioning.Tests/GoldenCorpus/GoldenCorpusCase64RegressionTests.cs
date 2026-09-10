using System.Text.Json;

using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Suite", "Core")]
public sealed class GoldenCorpusCase64RegressionTests
{
    [Fact]
    public async Task Case64_matches_expected_topology_security_drift_output()
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

        string caseDir = Path.Combine(GoldenCorpusRepoPaths.CorpusOutputDirectory, "case-64");
        string inputPath = Path.Combine(caseDir, "input.json");
        File.Exists(inputPath).Should().BeTrue($"missing {inputPath}");

        string inputJson = await File.ReadAllTextAsync(inputPath);
        GoldenCorpusInputDocument? input =
            JsonSerializer.Deserialize<GoldenCorpusInputDocument>(inputJson, GoldenCorpusJson.SerializerOptions);

        input.Should().NotBeNull();
        GraphSnapshot graph = input!.GraphSnapshot;

        CollectingAuditService audit = new();
        GoldenCorpusRunArtifacts actual = await harness.RunAsync(
            input.RunId,
            input.ContextSnapshotId,
            graph,
            audit,
            merge: null,
            CancellationToken.None,
            input.InventoryFixture,
            input.PriorGraphFixture);

        string expectedFindings = await File.ReadAllTextAsync(Path.Combine(caseDir, "expected-findings.json"));
        actual.FindingsJson.Should().Be(expectedFindings);
    }
}
