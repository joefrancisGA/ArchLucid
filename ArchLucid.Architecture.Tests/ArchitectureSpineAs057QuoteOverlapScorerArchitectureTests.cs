using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-057 ratchet: deterministic quote-overlap support band scorer ships without LLM calls.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs057QuoteOverlapScorerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As057_scorer_is_pure_function_without_llm_or_network_dependencies()
    {
        string scorerPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Decisioning",
            "Findings",
            "FindingSemanticSupportBandScorer.cs");

        File.Exists(scorerPath).Should().BeTrue();

        string scorer = File.ReadAllText(scorerPath);

        scorer.Should().Contain("FindingSemanticSupportBandScorer");
        scorer.Should().Contain("ExplanationFaithfulnessTokenExtractor");
        scorer.Should().NotContain("AzureOpenAI");
        scorer.Should().NotContain("HttpClient");
        scorer.Should().NotContain("Embedding");
    }

    [Fact]
    public void As057_support_band_enum_matches_adr_0085_values()
    {
        string enumPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Decisioning",
            "Findings",
            "FindingSemanticSupportBand.cs");

        string enumSource = File.ReadAllText(enumPath);

        enumSource.Should().Contain("Supported");
        enumSource.Should().Contain("Unchecked");
        enumSource.Should().Contain("Unsupported");
        enumSource.Should().Contain("NotScored");
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
