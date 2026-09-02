using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>WK-06: actor-dependent engines fire on WK-08 seeded graphs plus one intake human.</summary>
[Trait("Suite", "Core")]
public sealed class GoldenCorpusActorEngineHarnessTests
{
    [Fact]
    public async Task Declaration_seeded_actors_emit_trust_boundary_privileged_access_and_external_exposure()
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
        GraphSnapshot graph = GoldenCorpusActorEngineGraphFactory.CreateDeclarationSeededActorGraph();

        FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
            GoldenCorpusActorEngineGraphFactory.RunId,
            GoldenCorpusActorEngineGraphFactory.ContextSnapshotId,
            graph,
            CancellationToken.None);

        snapshot.Findings.Select(static finding => finding.EngineType).Should().Contain("trust-boundary");
        snapshot.Findings.Select(static finding => finding.EngineType).Should().Contain("privileged-access");
        snapshot.Findings.Select(static finding => finding.EngineType).Should().Contain("external-exposure");
    }
}
