using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for the ten architecture create/review robustness suggestions on branch <c>robust</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1_synthesis_kernel_isolated_from_review_execute()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs");
        string source = File.ReadAllText(path);

        source.Should().NotContain("IArchitectureRunExecuteOrchestrator");
        source.Should().NotContain("IAuthorityRunOrchestrator");
        source.Should().NotContain("EnsureCommitReadyAgentResults");
    }

    [Fact]
    public void Suggestion2_architecture_version_lattice_is_wired()
    {
        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureVersionService.cs"))
            .Should()
            .BeTrue();

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations", "339_ArchitectureVersions.sql"))
            .Should()
            .BeTrue();

        string runRecord = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "ApplicationPorts", "Models", "RunRecord.cs"));

        runRecord.Should().Contain("ArchitectureVersionId");
    }

    [Fact]
    public void Suggestion3_commit_integrity_enforces_decision_grade_provenance()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Runs",
            "Orchestration",
            "CommitOutputIntegrityService.cs");

        string source = File.ReadAllText(path);

        source.Should().Contain("DecisionGradeFindingProvenanceValidator");
        source.Should().Contain("Commit blocked: one or more findings lack decision-grade provenance");
    }

    [Fact]
    public void Suggestion4_findings_orchestrator_uses_confluent_merge()
    {
        string source = ArchitectureSourceProbe.ReadFindingsPipeline();

        source.Should().Contain("FindingSnapshotConfluentMerger.Merge");
        source.Should().NotContain("GroupBy(static f => f.FindingType");
    }

    [Fact]
    public void Suggestion5_partial_engine_failure_surfaces_generation_status_and_commit_classifier()
    {
        string emitStage = ArchitectureSourceProbe.ReadFindingsPipeline();

        emitStage.Should().Contain("FindingsSnapshotGenerationStatus.PartiallyComplete");

        string decisioningStage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineDecisioningStage.cs"));

        decisioningStage.Should().Contain("FindingEngineFailureCommitClassifier");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "FindingEngineFailureCommitClassifier.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion6_authority_complete_runs_reject_execute()
    {
        string source = ArchitectureSourceProbe.ReadExecuteOrchestratorPipeline();

        source.Should().Contain("ThrowIfAuthorityPipelineCompleteAsync");

        string scopeResolve = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Execute",
                "ArchitectureRunExecuteScopeResolveStage.cs"));

        scopeResolve.Should().Contain("RunKernelCompleteness.IsAuthorityPipelineComplete");
    }

    [Fact]
    public void Suggestion7_intake_gates_block_sentinels_and_cloud_pack_mismatch()
    {
        string draftValidator = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "ArchitectureDraftReviewReadinessValidator.cs"));

        draftValidator.Should().Contain("HasUnconfirmedStructuredBriefPlaceholders");

        string apiValidator = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Validators", "ArchitectureRequestValidator.cs"));

        apiValidator.Should().Contain("PolicyPackCloudTargetMismatchEvaluator");
    }

    [Fact]
    public void Suggestion8_topology_proposals_validate_before_overlay()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Application",
            "Runs",
            "Orchestration",
            "AgentTopologyProposalMergeGate.cs");

        File.Exists(path).Should().BeTrue();

        string merge = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "AgentTopologyProposalGraphMerge.cs"));

        merge.Should().Contain("AgentTopologyProposalMergeGate.FilterValidatedProposals");
    }

    [Fact]
    public void Suggestion9_create_idempotency_hashes_request_body()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ArchitectureRunIdempotencyHashing.cs");
        string source = File.ReadAllText(path);

        source.Should().Contain("FingerprintRequest");
    }

    [Fact]
    public void Suggestion10_effectful_engines_and_generated_plugin_skip_set()
    {
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "ServiceCollectionExtensions.Decisioning.cs"));

        composition.Should().Contain("IEffectfulFindingEngine");

        File.Exists(Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Plugins", "BuiltInFindingEngineTypeCatalog.cs"))
            .Should()
            .BeTrue();
    }
}
