using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-13 architecture create/review robustness suggestions (121–130).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave13ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion121_manifest_retrieval_uses_lifecycle_guard()
    {
        string get = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Get.Manifest.cs"));

        get.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
        get.Should().Contain("AuthorityRunLifecyclePhaseListResolver");
    }

    [Fact]
    public void Suggestion122_pin_enforcement_at_create()
    {
        string row = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Governance", "PolicyPacks", "PinnedPolicyPackRow.cs"));

        row.Should().Contain("BlockCommitOnCritical");
        row.Should().Contain("BlockCommitMinimumSeverity");

        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunPolicyPackPinService.cs"));

        pinService.Should().Contain("BlockCommitOnCritical");
    }

    [Fact]
    public void Suggestion123_decision_receipt_binds_manifest_hash()
    {
        string receipt = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Exports", "DecisionReceiptDocument.cs"));

        receipt.Should().Contain("ManifestHashSha256");
        receipt.Should().Contain("ManifestVersion");

        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Finalization", "ManifestDecisionReceiptExportBinder.cs"));

        service.Should().Contain("manifest.ManifestHash");
    }

    [Fact]
    public void Suggestion124_committed_artifact_inventory()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Finalization",
                    "ManifestCommittedArtifactInventoryCapturer.cs"))
            .Should()
            .BeTrue();

        string manifest = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Manifest", "ManifestDocument.cs"));

        manifest.Should().Contain("CommittedArtifactInventory");
    }

    [Fact]
    public void Suggestion125_evidence_referential_integrity_at_commit()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Governance",
                    "FindingEvidenceReferentialIntegrityValidator.cs"))
            .Should()
            .BeTrue();

        string integrity = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Orchestration", "CommitOutputIntegrityService.cs"));

        integrity.Should().Contain("FindingEvidenceReferentialIntegrityValidator");
    }

    [Fact]
    public void Suggestion126_compare_input_fingerprints()
    {
        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Core", "Comparison", "CompareInputFingerprints.cs"))
            .Should()
            .BeTrue();

        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.cs"));

        compare.Should().Contain("BuildCompareInputFingerprints");
        compare.Should().Contain("InputFingerprints");
    }

    [Fact]
    public void Suggestion127_replay_scope_assertions()
    {
        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ReplayRunScopeAssertionGuard.cs"))
            .Should()
            .BeTrue();

        string prepare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunPrepareStage.cs"));

        prepare.Should().Contain("ReplayRunScopeAssertionGuard");
    }

    [Fact]
    public void Suggestion128_lifecycle_transition_audit()
    {
        string auditTypes = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Audit", "AuditEventTypes.cs"));

        auditTypes.Should().Contain("LifecycleTransition");

        File.Exists(
                Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "AuthorityRunLifecycleTransitionAuditor.cs"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Suggestion129_hasher_v8()
    {
        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        hasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        hasher.Should().Contain("CommittedArtifactInventory");
    }

    [Fact]
    public void Suggestion130_commit_recovery_verifier()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Orchestration",
                    "Commit",
                    "AuthorityCommitRecoveryVerifier.cs"))
            .Should()
            .BeTrue();

        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("AuthorityCommitRecoveryVerifier");
    }
}
