using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-15 architecture create/review robustness suggestions (141–150).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave15ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion141_hasher_b_callers_pass_inventory_rows()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Finalization",
                    "CommittedArtifactInventoryFingerprintProjector.cs"))
            .Should()
            .BeTrue();

        string cohort = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "GoldenCohortSimulatorDriftTests.cs"));

        cohort.Should().Contain("committedArtifactInventory");
        cohort.Should().Contain("ComputeContentSha256Hex(");

        string cli = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "ArchLucidCliApiClient.Runs.FingerprintSeed.cs"));

        cli.Should().Contain("ComputeContentSha256Hex(");
    }

    [Fact]
    public void Suggestion142_bundle_inventory_hashes_blob_bytes()
    {
        string factory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestCommittedArtifactInventoryMaterialFactory.cs"));

        factory.Should().Contain("PreloadedArtifactBundle");
        factory.Should().Contain("ManifestCommittedArtifactInventoryBundleMaterialSerializer");
    }

    [Fact]
    public void Suggestion143_recovery_recomputes_inventory_hashes()
    {
        string capturer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestCommittedArtifactInventoryCapturer.cs"));

        capturer.Should().Contain("EnsureStoredInventoryContentHashesMatchOrThrow");

        string verifier = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        verifier.Should().Contain("recomputedMaterial");
    }

    [Fact]
    public void Suggestion144_typed_evidence_package_id_on_finding()
    {
        string finding = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "Finding.cs"));

        finding.Should().Contain("EvidencePackageId");

        string keys = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "FindingPropertyKeys.cs"));

        keys.Should().Contain("EvidencePackageId");

        string resolver = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "FindingPinnedEvidencePackageReferenceResolver.cs"));

        resolver.Should().Contain("finding.EvidencePackageId");
    }

    [Fact]
    public void Suggestion145_openapi_compare_input_fingerprints_inventory()
    {
        string openApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "OpenApi",
                "PublicHttpContractSchemasOpenApiDocumentTransformer.cs"));

        openApi.Should().Contain("ApplyCompareInputFingerprints");
        openApi.Should().Contain("baseCommittedArtifactInventoryHashSha256");

        string fingerprints = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Comparison", "CompareInputFingerprints.cs"));

        fingerprints.Should().Contain("BaseCommittedArtifactInventoryHashSha256");
    }

    [Fact]
    public void Suggestion146_lifecycle_transition_on_create()
    {
        string writer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Common",
                "BaselineMutationAuditArchitectureDurableWriter.cs"));

        writer.Should().Contain("run-created");
        writer.Should().Contain("AuthorityRunLifecycleTransitionAuditor");
    }

    [Fact]
    public void Suggestion147_async_execute_asserts_scope()
    {
        string hosted = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Async",
                "ArchitectureRunAsyncOperationHostedService.cs"));

        hosted.Should().Contain("ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow");
    }

    [Fact]
    public void Suggestion148_replay_clone_fail_closed_without_source_header()
    {
        string clone = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunCloneStage.cs"));

        clone.Should().Contain("source run header binding");

        string execute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunExecutePreparedStage.cs"));

        execute.Should().Contain("evidence clone requires create-time pins");
    }

    [Fact]
    public void Suggestion149_skip_persist_still_seals_inventory()
    {
        string artifacts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Artifacts.cs"));

        artifacts.Should().Contain("SkipPersistingPipelineArtifacts");
        artifacts.Should().Contain("ManifestCommittedArtifactInventoryCapturer.ApplyToManifest");
    }

    [Fact]
    public void Suggestion150_decision_receipt_hash_and_hasher_v10()
    {
        string hasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptCanonicalHasher.cs"));

        hasher.Should().Contain("ComputeSha256Hex");

        string receipt = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Exports", "DecisionReceiptDocument.cs"));

        receipt.Should().Contain("ReceiptHashSha256");

        string manifestHasher = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs"));

        manifestHasher.Should().Contain("HasherSchemaVersion = \"v12\"");
        manifestHasher.Should().Contain("CommittedDecisionReceiptHashSha256");
    }
}
