using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-14 architecture create/review robustness suggestions (131–140).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave14ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion131_decision_receipt_fail_closed_on_missing_hash()
    {
        string composer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptComposer.cs"));

        composer.Should().Contain("Committed-run decision receipts require a manifest hash binding");

        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "Finalization", "ManifestDecisionReceiptExportBinder.cs"));

        service.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
    }

    [Fact]
    public void Suggestion132_evidence_refs_resolve_to_pinned_package_ids()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Governance",
                    "FindingPinnedEvidencePackageReferenceResolver.cs"))
            .Should()
            .BeTrue();

        string validator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "FindingEvidenceReferentialIntegrityValidator.cs"));

        validator.Should().Contain("FindingPinnedEvidencePackageReferenceResolver");
    }

    [Fact]
    public void Suggestion133_inventory_hashes_blob_bytes()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Finalization",
                    "ManifestCommittedArtifactInventoryMaterialFactory.cs"))
            .Should()
            .BeTrue();

        string capturer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestCommittedArtifactInventoryCapturer.cs"));

        capturer.Should().Contain("HashUtf8");
    }

    [Fact]
    public void Suggestion134_hasher_b_binds_committed_artifact_inventory()
    {
        string fingerprint = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Manifest", "GoldenManifestFingerprint.cs"));

        fingerprint.Should().Contain("committedArtifactInventory");
        fingerprint.Should().Contain("CommittedArtifactInventoryFingerprintRow");
    }

    [Fact]
    public void Suggestion135_openapi_documents_receipt_and_compare_fingerprints()
    {
        string openApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "OpenApi",
                "PublicHttpContractSchemasOpenApiDocumentTransformer.cs"));

        openApi.Should().Contain("ApplyDecisionReceiptDocument");
        openApi.Should().Contain("ApplyComparisonResult");
        openApi.Should().Contain("manifestHashSha256");
    }

    [Fact]
    public void Suggestion136_execute_and_quality_gate_emit_lifecycle_transitions()
    {
        string writer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Common",
                "BaselineMutationAuditArchitectureDurableWriter.cs"));

        writer.Should().Contain("execute-started");
        writer.Should().Contain("quality-gate-rejected");
        writer.Should().Contain("AuthorityRunLifecycleTransitionAuditor");
    }

    [Fact]
    public void Suggestion137_replay_factory_requires_source_header()
    {
        string factory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ReplayAuthorityRunRecordFactory.cs"));

        factory.Should().Contain("source run header is required");
    }

    [Fact]
    public void Suggestion138_incomplete_execute_asserts_scope()
    {
        string handler = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "IncompleteAuthorityPipelineExecuteHandler.cs"));

        handler.Should().Contain("ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow");
    }

    [Fact]
    public void Suggestion139_recovery_verifier_checks_inventory()
    {
        string verifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        verifier.Should().Contain("EnsureInventoryConsistentOrThrow");
    }

    [Fact]
    public void Suggestion140_manifest_compare_requires_pin_fingerprints()
    {
        string compare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.cs"));

        compare.Should().Contain("EnsureCreateTimePinFingerprintsMatchOrThrow");
        compare.Should().Contain("RunComparePinFingerprintGuard");
    }

    [Fact]
    public void Suggestion133_hasher_v9_baseline()
    {
        File.Exists(
                Path.Combine(RepoRoot, "tests", "manifest-hash", "hasher-baseline-v9.json"))
            .Should()
            .BeTrue();
    }
}
