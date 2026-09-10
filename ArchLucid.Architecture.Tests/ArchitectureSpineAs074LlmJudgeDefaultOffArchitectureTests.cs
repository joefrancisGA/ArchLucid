using ArchLucid.Core.Findings;
using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-074 ratchet: premium LLM semantic judge for support band stays default off.</summary>
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
    public void As074_options_default_enable_llm_judge_false()
    {
        string optionsSource = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Findings", "FindingSemanticSupportBandOptions.cs"));

        optionsSource.Should().Contain("EnableLlmJudge");
        optionsSource.Should().Contain("= false");
        optionsSource.Should().Contain("AS-074");
    }

    [Fact]
    public void As074_host_registers_noop_llm_judge_by_default()
    {
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "ServiceCollectionExtensions.Decisioning.cs"));

        composition.Should().Contain("FindingSemanticSupportBandOptions");
        composition.Should().Contain("IFindingSemanticSupportBandLlmJudge");
        composition.Should().Contain("NoOpFindingSemanticSupportBandLlmJudge");
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
    public void As074_emission_applicator_skips_llm_judge_when_option_disabled()
    {
        string emission = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Findings",
                "FindingSemanticSupportBandEmissionApplicator.cs"));

        emission.Should().Contain("options.EnableLlmJudge");
        emission.Should().Contain("FindingSemanticSupportBandScorer.Score");
        emission.Should().NotContain("CompleteJsonAsync");
        emission.Should().NotContain("AgentOutputLlmSemanticJudge");
    }

    [Fact]
    public void As074_adr_0085_documents_default_off_llm_judge()
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
