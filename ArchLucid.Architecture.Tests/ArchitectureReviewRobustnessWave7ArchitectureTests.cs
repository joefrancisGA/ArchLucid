using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-7 architecture create/review robustness suggestions (61–70).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave7ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion61_evidence_pin_hash_verified_at_commit()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"));

        pinService.Should().Contain("VerifyPinIntegrityOrThrowAsync");

        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("_runEvidencePackagePinService");
        commitIntegrity.Should().Contain("VerifyPinIntegrityOrThrowAsync");
    }

    [Fact]
    public void Suggestion62_replay_clones_create_time_pins()
    {
        string factory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ReplayAuthorityRunRecordFactory.cs"));

        factory.Should().Contain("PinnedPolicyPackIdsJson");
        factory.Should().Contain("PinnedEvidencePackagePinsHashSha256");
        factory.Should().Contain("PinnedFocusedPilotModeEnabled");
    }

    [Fact]
    public void Suggestion63_commit_loads_knowledge_model_for_kappa()
    {
        string commitIntegrity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        commitIntegrity.Should().Contain("_architectureKnowledgeModelAccess");
        commitIntegrity.Should().Contain("GetForRunAsync");
        commitIntegrity.Should().NotContain("knowledgeModel: null");
    }

    [Fact]
    public void Suggestion64_export_surfaces_use_lifecycle_guard()
    {
        string csv = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Query",
                "Stages",
                "RunFindingsCsvExportStage.cs"));

        csv.Should().Contain("AuthorityLifecycleCompareExportGuard");

        string docx = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));

        docx.Should().Contain("AuthorityLifecycleCompareExportGuard");
    }

    [Fact]
    public void Suggestion65_ui_uses_authority_lifecycle_phase()
    {
        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "authority-lifecycle-commit-block.ts"));

        compare.Should().Contain("authorityLifecyclePhase");
        compare.Should().Contain("authorityLifecyclePhaseLabel");
    }

    [Fact]
    public void Suggestion66_evidence_pin_json_fail_closed()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"));

        pinService.Should().Contain("not a valid PinnedEvidencePackageRow array");

        string binder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitCreateTimePinBinder.cs"));

        binder.Should().Contain("not a valid PinnedEvidencePackageRow array");
    }

    [Fact]
    public void Suggestion67_effectful_loader_honors_pin_commitment()
    {
        string context = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Architecture", "FindingAnalysisContext.cs"));

        context.Should().Contain("HasCreateTimeEvidencePinCommitment");

        string loader = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Findings",
                "EffectfulFindingEngineEvidenceLoader.cs"));

        loader.Should().Contain("EvidencePins");
        loader.Should().Contain("ResolvePinnedPin");
    }

    [Fact]
    public void Suggestion68_agent_loop_restores_focused_pilot_from_header()
    {
        string agentLoop = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Execute",
                "AgentLoopPrepareStage.cs"));

        agentLoop.Should().Contain("BeginRestoredScope");
        agentLoop.Should().Contain("PinnedFocusedPilotModeEnabled");
    }

    [Fact]
    public void Suggestion69_manifest_hasher_v4_binds_evidence_pin_hash()
    {
        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        hasher.Should().Contain("CreateTimeEvidencePackagePinsHashSha256");
    }

    [Fact]
    public void Suggestion70_list_resolver_shared_with_failed_phase()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Core",
                    "Runs",
                    "AuthorityRunLifecyclePhaseListResolver.cs"))
            .Should()
            .BeTrue();

        string mapper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Queries", "AuthorityRunMapper.cs"));

        mapper.Should().Contain("AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader");
        mapper.Should().NotContain("ResolveListLifecyclePhase");
    }
}
