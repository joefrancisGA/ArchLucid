using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-5 architecture create/review robustness suggestions (41–50).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave5ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion41_cross_run_engines_load_prior_graph_snapshot()
    {
        string topologyEngine = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "TopologyCrossRunDiffFindingEngine.cs"));

        topologyEngine.Should().Contain("IGraphSnapshotRepository");
        topologyEngine.Should().Contain("GetByIdAsync");

        string analyzer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Analysis", "GraphSnapshotTopologyDiffAnalyzer.cs"));

        analyzer.Should().Contain("AnalyzeCategoryDelta(GraphSnapshot graphSnapshot, GraphSnapshot? priorGraph)");
    }

    [Fact]
    public void Suggestion42_policy_pack_pin_includes_version()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Contracts",
                    "Governance",
                    "PolicyPacks",
                    "PinnedPolicyPackRow.cs"))
            .Should()
            .BeTrue();

        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunPolicyPackPinService.cs"));

        pinService.Should().Contain("PinnedPolicyPackRow");
        pinService.Should().Contain("PolicyPackVersion");
    }

    [Fact]
    public void Suggestion43_effectful_evidence_loader_uses_package_id()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Findings",
                    "EffectfulFindingEngineEvidenceLoader.cs"))
            .Should()
            .BeTrue();

        string loader = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Findings",
                "EffectfulFindingEngineEvidenceLoader.cs"));

        loader.Should().Contain("TryGetDownloadByPackageIdAsync");
    }

    [Fact]
    public void Suggestion44_commit_reverifies_pin_and_draft_hashes()
    {
        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("VerifyPinIntegrityOrThrowAsync");
        commitIntegrity.Should().Contain("SpawnedDocumentContentHashSha256");
        commitIntegrity.Should().Contain("GetBySpawnedRunIdAsync");
    }

    [Fact]
    public void Suggestion45_manifest_hash_includes_architecture_version_id()
    {
        string manifestDocument = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Manifest", "ManifestDocument.cs"));

        manifestDocument.Should().Contain("ArchitectureVersionId");

        string hashService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hashService.Should().Contain("manifest.ArchitectureVersionId");
    }

    [Fact]
    public void Suggestion46_replay_execute_uses_authority_path()
    {
        string replayExecute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunExecutePreparedStage.cs"));

        replayExecute.Should().Contain("ExecuteAuthorityPreparedReplayAsync");
        replayExecute.Should().Contain("AuthorityPipelineComplete");
        replayExecute.Should().Contain("CompleteQueuedAuthorityPipelineAsync");
    }

    [Fact]
    public void Suggestion47_ui_authority_lifecycle_phase_commit_gated()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "archlucid-ui",
                    "src",
                    "lib",
                    "runs",
                    "authority-lifecycle-commit-block.ts"))
            .Should()
            .BeTrue();

        string governance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "run-detail-page-presentation-governance.ts"));

        governance.Should().Contain("resolveAuthorityLifecycleCommitBlock");

        string strip = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailPackageStatusStrip.tsx"));

        strip.Should().Contain("authorityLifecyclePhase");
    }

    [Fact]
    public void Suggestion48_authority_phase_writes_split_from_legacy_status()
    {
        string transitionService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Runs", "IRunStateTransitionService.cs"));

        transitionService.Should().Contain("ShouldSkipLegacyRunStatusPatchAfterAuthorityProgress");

        string processor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "AuthorityPipelineMaterializeWork.cs"));

        processor.Should().Contain("ShouldSkipLegacyRunStatusPatchAfterAuthorityProgress");
    }

    [Fact]
    public void Suggestion49_synthesis_kernel_pack_pin_and_admittance_guard()
    {
        string kernel = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs"));

        kernel.Should().Contain("StructuralExecutionModeAdmittanceGuard.EnsureAdmittableOrThrow");
        kernel.Should().Contain("_runCreatePinOrchestrator.ApplyCreateTimePinsAsync");
    }

    [Fact]
    public void Suggestion50_plugin_skip_set_from_di_registration()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Decisioning",
                    "Plugins",
                    "RegisteredFindingEngineTypeRegistry.cs"))
            .Should()
            .BeTrue();

        string hosted = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Decisioning",
                "Hosting",
                "FindingEngineRegistrationDistinctnessHostedService.cs"));

        hosted.Should().Contain("RegisteredFindingEngineTypeRegistry.ReplaceRegisteredEngineTypeIds");
    }
}
