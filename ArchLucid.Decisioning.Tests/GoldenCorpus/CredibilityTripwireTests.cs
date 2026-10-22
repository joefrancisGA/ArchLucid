using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
/// Cross-engine trust tripwires: failures must remain visible and persisted findings must be internally coherent.
/// </summary>
[Trait("Suite", "Core")]
public sealed class CredibilityTripwireTests
{
    [Fact]
    public async Task Golden_corpus_findings_and_failures_satisfy_cross_engine_trust_invariants()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);

        foreach (string dir in Directory.GetDirectories(GoldenCorpusRepoPaths.CorpusOutputDirectory)
                     .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase))
        {
            string inputJson = await File.ReadAllTextAsync(Path.Combine(dir, "input.json"));
            GoldenCorpusInputDocument input =
                JsonSerializer.Deserialize<GoldenCorpusInputDocument>(
                    inputJson,
                    GoldenCorpusJson.SerializerOptions)
                ?? throw new InvalidOperationException($"Could not deserialize {dir}.");

            GraphSnapshot graph = input.GraphSnapshot;
            FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
                graph.RunId,
                graph.ContextSnapshotId,
                graph,
                CancellationToken.None,
                input.InventoryFixture,
                input.PriorGraphFixture,
                input.AssignedPackFixture);

            List<Finding> visibleFindings = snapshot.Findings
                .Concat(snapshot.ChecklistCoverage)
                .ToList();

            visibleFindings
                .Select(static finding => finding.FindingId)
                .Should()
                .OnlyHaveUniqueItems($"finding identity must not disagree within {Path.GetFileName(dir)}");

            foreach (Finding finding in visibleFindings)
            {
                finding.FindingId.Should().NotBeNullOrWhiteSpace();
                finding.FindingType.Should().NotBeNullOrWhiteSpace();
                finding.Category.Should().NotBeNullOrWhiteSpace();
                finding.EngineType.Should().NotBeNullOrWhiteSpace();
                finding.Title.Should().NotBeNullOrWhiteSpace();
                finding.Rationale.Should().NotBeNullOrWhiteSpace();
                finding.EvidenceRefs.Should().OnlyContain(static reference => !string.IsNullOrWhiteSpace(reference));
            }

            foreach (FindingEngineFailure failure in snapshot.EngineFailures)
            {
                failure.EngineType.Should().NotBeNullOrWhiteSpace();
                failure.Category.Should().NotBeNullOrWhiteSpace();
                failure.ErrorMessage.Should().NotBeNullOrWhiteSpace();
                failure.ExceptionType.Should().NotBeNullOrWhiteSpace();
            }

            if (snapshot.EngineFailures.Count > 0)
            {
                snapshot.GenerationStatus.Should().NotBe(
                    FindingsSnapshotGenerationStatus.Complete,
                    "an engine failure must never masquerade as a clean evaluation");
            }
        }
    }
}
