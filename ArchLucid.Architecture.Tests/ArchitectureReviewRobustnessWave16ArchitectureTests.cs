using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-16 architecture create/review robustness suggestions (151–160).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave16ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion151_recovery_passes_recomputed_inventory_material()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Finalization",
                    "ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.cs"))
            .Should()
            .BeTrue();

        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("ManifestCommittedArtifactInventoryRecoveryMaterialBuilder.BuildAsync");
        orchestrator.Should().Contain("recomputedMaterial");

        string verifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        verifier.Should().Contain("recomputed artifact inventory material is required");
    }

    [Fact]
    public void Suggestion152_finding_json_round_trips_evidence_package_id()
    {
        string converter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Findings",
                "Serialization",
                "FindingJsonConverter.cs"));

        converter.Should().Contain("evidencePackageId");
        converter.Should().Contain("EvidencePackageId");

        string tests = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core.Tests",
                "Findings",
                "Serialization",
                "FindingJsonConverterTests.cs"));

        tests.Should().Contain("RoundTrip_preservesEvidencePackageId");
    }

    [Fact]
    public void Suggestion153_hasher_b_does_not_default_inventory_to_null()
    {
        string fingerprint = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Manifest", "GoldenManifestFingerprint.cs"));

        fingerprint.Should().Contain("EmptyCommittedArtifactInventory");
        fingerprint.Should().NotContain("committedArtifactInventory: null");
    }

    [Fact]
    public void Suggestion154_receipt_hash_for_all_committed_runs()
    {
        string capturer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestDecisionReceiptHashCapturer.cs"));

        capturer.Should().NotContain("IsExportableVerdict");
        capturer.Should().Contain("CommittedDecisionReceiptHashSha256");
    }

    [Fact]
    public void Suggestion155_async_replay_asserts_scope()
    {
        string hosted = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Async",
                "ArchitectureRunAsyncOperationHostedService.cs"));

        hosted.Should().Contain("ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow");
        hosted.Should().Contain("replaySourceHeader");
    }

    [Fact]
    public void Suggestion156_compare_inventory_fingerprint_guard()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunComparePinFingerprintGuard.cs"));

        guard.Should().Contain("EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow");

        string facade = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.cs"));

        facade.Should().Contain("EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow");
    }

    [Fact]
    public void Suggestion157_replay_clone_preserves_evidence_package_id()
    {
        string clone = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunCloneStage.cs"));

        clone.Should().Contain("EvidencePackageId = original.EvidencePackageId");
    }

    [Fact]
    public void Suggestion158_skip_persist_captures_governance_and_review_snapshots()
    {
        string artifacts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Artifacts.cs"));

        int skipIndex = artifacts.IndexOf("SkipPersistingPipelineArtifacts", StringComparison.Ordinal);
        int governanceIndex = artifacts.IndexOf("_committedEffectiveGovernanceSnapshotCapturer.ApplyToManifestAsync", StringComparison.Ordinal);
        int reviewIndex = artifacts.IndexOf("_committedReviewStandardsSnapshotCapturer.ApplyToManifest", StringComparison.Ordinal);

        skipIndex.Should().BeGreaterThan(0);
        governanceIndex.Should().BeGreaterThan(0).And.BeLessThan(skipIndex);
        reviewIndex.Should().BeGreaterThan(0).And.BeLessThan(skipIndex);
    }

    [Fact]
    public void Suggestion159_findings_inventory_hashes_persisted_blob_bytes()
    {
        string factory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestCommittedArtifactInventoryMaterialFactory.cs"));

        factory.Should().Contain("FindingsSerialization.SerializeSnapshot");
    }

    [Fact]
    public void Suggestion160_hasher_v11_and_openapi_snapshot()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "tests",
                    "manifest-hash",
                    "hasher-baseline-v11.json"))
            .Should()
            .BeTrue();

        string openApiSnapshot = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api.Tests",
                "Contracts",
                "openapi-v1.contract.snapshot.json"));

        openApiSnapshot.Should().Contain("baseCommittedArtifactInventoryHashSha256");
    }
}
