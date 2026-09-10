using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-074 ratchet: premium LLM semantic support judge stays default off.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs074LlmJudgeDefaultOffArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md";

    [Fact]
    public void As074_insight_density_gate_options_default_semantic_support_llm_judge_off()
    {
        InsightDensityGateOptions options = new();

        options.EnableSemanticSupportBandLlmJudge.Should().BeFalse();
    }

    [Fact]
    public void As074_scorer_remains_heuristic_default_without_llm_judge_flag()
    {
        string scorer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Findings",
                "FindingSemanticSupportBandScorer.cs"));

        scorer.Should().Contain("Deterministic quote-overlap heuristic");
        scorer.Should().NotContain("EnableSemanticSupportBandLlmJudge");
    }

    [Fact]
    public void As074_adr_0085_documents_default_off_llm_judge_follow_up()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("AS-074");
        adr.Should().Contain("default off");
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
