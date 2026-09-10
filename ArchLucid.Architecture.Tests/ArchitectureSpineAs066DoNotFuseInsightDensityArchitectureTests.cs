using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-066 ratchet: semantic support band must not fuse into insight-density demotion.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] DensityGateSourceRelativePaths =
    [
        Path.Combine("ArchLucid.Core", "Findings", "DeterministicInsightDensityGate.cs"),
        Path.Combine("ArchLucid.Core", "Findings", "InsightDensityDemotionPredicate.cs"),
        Path.Combine("ArchLucid.Core", "Findings", "InsightDensityGateCandidate.cs"),
        Path.Combine("ArchLucid.Core", "Findings", "FindingInsightDensityGateApplicator.cs"),
    ];

    private static readonly string[] ForbiddenSupportBandTokens =
    [
        "SemanticSupportBand",
        "FindingSemanticSupportBand",
        "semantic-support",
        "support-band",
        "unsupported-semantic",
        "semantic-support-band",
    ];

    [Fact]
    public void As066_density_gate_sources_do_not_reference_semantic_support_band()
    {
        foreach (string relativePath in DensityGateSourceRelativePaths)
        {
            string path = Path.Combine(RepoRoot, relativePath);
            File.Exists(path).Should().BeTrue($"expected density gate source at {relativePath}");

            string source = File.ReadAllText(path);

            foreach (string token in ForbiddenSupportBandTokens)
            {
                source.Should().NotContain(
                    token,
                    because: $"{relativePath} must not fuse semantic support band into insight-density (AS-066)");
            }
        }
    }

    [Fact]
    public void As066_density_gate_penalty_reasons_exclude_support_band_terms()
    {
        string densityGatePath = Path.Combine(
            RepoRoot,
            "ArchLucid.Core",
            "Findings",
            "DeterministicInsightDensityGate.cs");

        string densityGate = File.ReadAllText(densityGatePath);

        foreach (string token in ForbiddenSupportBandTokens.Where(static token => token.Contains('-', StringComparison.Ordinal)))
        {
            densityGate.Should().NotContain(
                token,
                because: "insight-density penalty reasons must not encode semantic support band demotion");
        }
    }

    [Fact]
    public void As066_findings_merge_stage_scores_density_before_support_band_overlay()
    {
        string stagePath = Path.Combine(
            RepoRoot,
            "ArchLucid.Decisioning",
            "Services",
            "Findings",
            "FindingsMergeAndGateStage.cs");

        string stage = File.ReadAllText(stagePath);

        int densityApplicatorIndex = stage.IndexOf(
            "FindingInsightDensityGateApplicator.ApplyToFindings",
            StringComparison.Ordinal);

        int defaultsApplicatorIndex = stage.IndexOf(
            "FindingSemanticSupportBandDefaultsApplicator.Apply",
            StringComparison.Ordinal);

        int emissionApplicatorIndex = stage.IndexOf(
            "FindingSemanticSupportBandEmissionApplicator.Apply",
            StringComparison.Ordinal);

        densityApplicatorIndex.Should().BeGreaterThan(-1);
        defaultsApplicatorIndex.Should().BeGreaterThan(densityApplicatorIndex);
        emissionApplicatorIndex.Should().BeGreaterThan(defaultsApplicatorIndex);
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
