using System.Text.Json;

using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Suite", "Core")]
public sealed class ArchLucidMetamorphicAssuranceTests
{
    private static readonly string[] RepresentativeCases =
    [
        "case-01",
        "case-37",
        "case-64",
        "case-73",
    ];

    [Fact]
    public async Task Representative_cases_are_invariant_to_graph_collection_order()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue();

        foreach (string caseName in RepresentativeCases)
        {
            GoldenCorpusInputDocument baselineInput = await LoadInputAsync(caseName);
            GoldenCorpusInputDocument transformedInput = Clone(baselineInput);

            transformedInput.GraphSnapshot.Nodes.Reverse();
            transformedInput.GraphSnapshot.Edges.Reverse();

            if (transformedInput.PriorGraphFixture is not null)
            {
                transformedInput.PriorGraphFixture.PriorGraphSnapshot.Nodes.Reverse();
                transformedInput.PriorGraphFixture.PriorGraphSnapshot.Edges.Reverse();
            }

            GoldenCorpusRunArtifacts baseline = await RunAsync(compliance, baselineInput);
            GoldenCorpusRunArtifacts transformed = await RunAsync(compliance, transformedInput);

            transformed.FindingsJson.Should().Be(
                baseline.FindingsJson,
                because: $"{caseName} node/edge collection order is not architecture meaning");
            transformed.DecisionsJson.Should().Be(
                baseline.DecisionsJson,
                because: $"{caseName} node/edge collection order is not decision meaning");
            transformed.AuditTypesJson.Should().Be(
                baseline.AuditTypesJson,
                because: $"{caseName} node/edge collection order is not audit meaning");
        }
    }

    [Fact]
    public async Task Representative_cases_are_invariant_to_json_round_trip()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        foreach (string caseName in RepresentativeCases)
        {
            GoldenCorpusInputDocument baselineInput = await LoadInputAsync(caseName);
            GoldenCorpusInputDocument roundTrippedInput = Clone(baselineInput);

            GoldenCorpusRunArtifacts baseline = await RunAsync(compliance, baselineInput);
            GoldenCorpusRunArtifacts roundTripped = await RunAsync(compliance, roundTrippedInput);

            roundTripped.Should().BeEquivalentTo(baseline);
        }
    }

    private static async Task<GoldenCorpusInputDocument> LoadInputAsync(string caseName)
    {
        string path = Path.Combine(GoldenCorpusRepoPaths.CorpusOutputDirectory, caseName, "input.json");
        File.Exists(path).Should().BeTrue();

        string json = await File.ReadAllTextAsync(path);

        return JsonSerializer.Deserialize<GoldenCorpusInputDocument>(
                   json,
                   GoldenCorpusJson.SerializerOptions)
               ?? throw new InvalidOperationException($"Could not deserialize {caseName}.");
    }

    private static GoldenCorpusInputDocument Clone(GoldenCorpusInputDocument source)
    {
        string json = JsonSerializer.Serialize(source, GoldenCorpusJson.SerializerOptions);

        return JsonSerializer.Deserialize<GoldenCorpusInputDocument>(
                   json,
                   GoldenCorpusJson.SerializerOptions)
               ?? throw new InvalidOperationException("Golden input round-trip returned null.");
    }

    private static async Task<GoldenCorpusRunArtifacts> RunAsync(
        string compliance,
        GoldenCorpusInputDocument input)
    {
        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);
        CollectingAuditService audit = new();

        return await harness.RunAsync(
            input.RunId,
            input.ContextSnapshotId,
            input.GraphSnapshot,
            audit,
            input.Merge?.ToModel(),
            CancellationToken.None,
            input.InventoryFixture,
            input.PriorGraphFixture,
            input.AssignedPackFixture);
    }
}
