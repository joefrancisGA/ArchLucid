using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-066 ratchet: semantic support band must not fuse into ADR 0070 insight-density demotion.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string DensityGateRelativePath =
        "ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs";

    private const string DensityCandidateRelativePath =
        "ArchLucid.Core/Findings/InsightDensityGateCandidate.cs";

    private const string AdrRelativePath =
        "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

    [Fact]
    public void As066_density_gate_source_has_no_semantic_support_band_dependency()
    {
        string densityGate = File.ReadAllText(Path.Combine(RepoRoot, DensityGateRelativePath));

        densityGate.Should().NotMatchRegex(@"\.\s*SemanticSupportBand\b", "gate must not access support band property");
        densityGate.Should().NotContain("FindingSemanticSupportBand");
        densityGate.Should().Contain("AS-066");
    }

    [Fact]
    public void As066_density_gate_candidate_does_not_carry_semantic_support_band()
    {
        string candidate = File.ReadAllText(Path.Combine(RepoRoot, DensityCandidateRelativePath));

        candidate.Should().NotContain("SemanticSupportBand");
        candidate.Should().NotContain("FindingSemanticSupportBand");
    }

    [Fact]
    public void As066_adr_0085_documents_insight_density_sibling_signal_follow_up()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("AS-066");
        adr.Should().Contain("insight-density");
        adr.Should().MatchRegex("not.*fused", "ADR must keep support band separate from insight-density demotion");
        adr.Should().Contain("ADR 0070");
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
