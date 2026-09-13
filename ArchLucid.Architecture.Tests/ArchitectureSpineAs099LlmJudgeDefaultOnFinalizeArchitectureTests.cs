using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>ADR 0099 ratchet: semantic support LLM judge is default-on for Real finalize, not emit.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs099LlmJudgeDefaultOnFinalizeArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0099-semantic-support-llm-judge-default-on-finalize.md";

    [Fact]
    public void As099_options_default_enable_llm_judge_on_finalize_true_emit_stays_false()
    {
        string optionsSource = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Findings", "FindingSemanticSupportBandOptions.cs"));

        optionsSource.Should().Contain("EnableLlmJudgeOnFinalize");
        optionsSource.Should().Contain("= true");
        optionsSource.Should().Contain("EnableLlmJudge");
        optionsSource.Should().Contain("= false");
        optionsSource.Should().Contain("ADR 0099");
    }

    [Fact]
    public void As099_real_composition_registers_premium_semantic_support_judge()
    {
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "Modules",
                "Agents",
                "AgentExecutionCompositionModule.ExecutorWiring.cs"));

        composition.Should().Contain("RemoveAll<IFindingSemanticSupportBandLlmJudge>");
        composition.Should().Contain("PremiumFindingSemanticSupportBandLlmJudge");
    }

    [Fact]
    public void As099_commit_and_readiness_call_finalize_judge_before_unsupported_hold()
    {
        string integrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        integrity.Should().Contain("_semanticSupportBandFinalizeJudge");
        integrity.Should().Contain("ApplyAsync(run, findings, scope, cancellationToken)");
        int judgeIndex = integrity.IndexOf("_semanticSupportBandFinalizeJudge", StringComparison.Ordinal);
        int holdIndex = integrity.IndexOf(
            "UnsupportedSemanticSupportFinalizeHoldEvaluator.GetBlockingReasons",
            StringComparison.Ordinal);
        judgeIndex.Should().BeGreaterThan(0);
        holdIndex.Should().BeGreaterThan(judgeIndex);

        string readiness = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "FinalizeReadinessService.cs"));

        readiness.Should().Contain("_semanticSupportBandFinalizeJudge");
        readiness.Should().Contain("ApplyAsync(architectureRun, findings, scope, cancellationToken)");
    }

    [Fact]
    public void As099_host_still_registers_noop_for_emit_default()
    {
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "ServiceCollectionExtensions.Decisioning.cs"));

        composition.Should().Contain("NoOpFindingSemanticSupportBandLlmJudge");
    }

    [Fact]
    public void As099_adr_exists_and_readme_lists_row()
    {
        string adrPath = Path.Combine(RepoRoot, AdrRelativePath);
        File.Exists(adrPath).Should().BeTrue();

        string adr = File.ReadAllText(adrPath);
        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("Security");
        adr.Should().Contain("EnableLlmJudgeOnFinalize");
        adr.Should().Contain("warn");
        adr.Should().Contain("Simulator");
        adr.Should().NotContain("G-REAL-06 live packets");

        string readme = File.ReadAllText(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "README.md"));
        readme.Should().Contain("0099-semantic-support-llm-judge-default-on-finalize.md");
        readme.Should().Contain("0098-working-instrument-after-spawn-is-desk.md");
    }

    [Fact]
    public void As099_authority_commit_registers_finalize_judge()
    {
        string registrar = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "Modules",
                "AuthorityCommitPipelineCompositionRegistrar.cs"));

        registrar.Should().Contain("IFindingSemanticSupportBandFinalizeJudge");
        registrar.Should().Contain("FindingSemanticSupportBandFinalizeJudge");
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
