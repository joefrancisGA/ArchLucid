using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// QR-01 ratchet: Decisioning.Tests graph factory and advisory guard exist.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class V8QualityRoiQr001ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Qr001_decisioning_graph_factory_and_advisory_guard_exist()
    {
        string factory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning.Tests",
                "GoldenCorpus",
                "GoldenCorpusIngestDeclarationGraphFactory.cs"));
        string guardScript = File.ReadAllText(
            Path.Combine(RepoRoot, "scripts", "ci", "check_insight_density_advisory_surfaces.py"));
        string ratchet = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "v8-quality-roi-ratchet.test.ts"));

        factory.Should().Contain("StructuredDiagramGraphMerger");
        guardScript.Should().Contain("typed-engine-scored");
        ratchet.Should().Contain("QR-01");
    }

    private static string FindRepoRoot()
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

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
