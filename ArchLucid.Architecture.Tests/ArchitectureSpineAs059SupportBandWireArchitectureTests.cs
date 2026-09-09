using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-059 ratchet: support band enum is on the finding wire contract.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs059SupportBandWireArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As059_finding_contract_exposes_semantic_support_band_property()
    {
        string finding = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "Finding.cs"));
        string architectureFinding = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "ArchitectureFinding.cs"));

        finding.Should().Contain("SemanticSupportBand");
        architectureFinding.Should().Contain("SemanticSupportBand");
    }

    [Fact]
    public void As059_defaults_applicator_runs_in_findings_merge_stage()
    {
        string stage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Services",
                "Findings",
                "FindingsMergeAndGateStage.cs"));

        stage.Should().Contain("FindingSemanticSupportBandDefaultsApplicator.Apply");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
