using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-21 architecture create/review robustness suggestions (201–210).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave21ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    private static string ReadCompareRunsFacadeSources() =>
        string.Join(
            '\n',
            Directory.GetFiles(
                    Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis"),
                    "CompareRunsApplicationFacade*.cs")
                .OrderBy(static path => path, StringComparer.Ordinal)
                .Select(File.ReadAllText));

    [Fact]
    public void Suggestion201_sponsor_review_packet_fail_closed_on_sealed_receipt()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "SponsorReviewPacketBuilder.cs"));

        builder.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");

        string binder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestDecisionReceiptExportBinder.cs"));

        binder.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
    }

    [Fact]
    public void Suggestion202_version_compare_applies_inventory_checked_topology_overlay()
    {
        string versionCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "CompareRunsApplicationFacade.VersionCompare.cs"));
        string builder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ManifestCompareInventoryCheckedDocumentBuilder.cs"));

        versionCompare.Should().Contain("ApplyProjectedTopologyToGoldenManifest");
        builder.Should().Contain("ApplyProjectedTopologyToGoldenManifest");
    }

    [Fact]
    public void Suggestion203_explain_compare_routes_through_pin_inventory_facade()
    {
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));

        controller.Should().Contain("compareRunsFacade.CompareManifestsAsync");
        controller.Should().Contain("CommittedArtifactInventoryMismatch");
    }

    [Fact]
    public void Suggestion204_audit_export_fail_closed_on_row_cap_truncation()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "AuditController.Export.Guard.cs"));

        guard.Should().Contain("CountFilteredAsync");
        guard.Should().Contain("AuditExportRowCapExceeded");
    }

    [Fact]
    public void Suggestion205_governance_mutation_correction_binds_sealed_manifest_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "GovernanceMutationCorrectionService.cs"));

        service.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
    }

    [Fact]
    public void Suggestion206_authority_manifest_id_compare_enforces_pin_inventory()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityCompareController.cs"));
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "AuthorityManifestIdCompareGuard.cs"));

        controller.Should().Contain("AuthorityManifestIdCompareGuard");
        guard.Should().Contain("EnsurePinAndInventoryFingerprintsMatchOrThrowAsync");
    }

    [Fact]
    public void Suggestion207_ui_blob_download_rejects_json_problem_as_zip()
    {
        string guard = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-guard.ts"));
        string trigger = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger.ts"));

        guard.Should().Contain("assertBinaryDownloadContentType");
        guard.Should().Contain("application/problem+json");
        trigger.Should().Contain("assertBinaryDownloadContentType");
    }

    [Fact]
    public void Suggestion208_signed_review_record_get_verifies_sealed_manifest_hash()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.SealedManifestGuard.cs"));
        string trail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));

        guard.Should().Contain("SealedManifestReadGuard");
        trail.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion209_skip_persist_recovery_fail_closed_on_decision_trace_inventory()
    {
        string finalization = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestFinalizationService.Artifacts.cs"));
        string capturer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestCommittedArtifactInventoryCapturer.cs"));
        string recovery = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Commit",
                "AuthorityCommitRecoveryVerifier.cs"));

        finalization.Should().Contain("EnsureDecisionTraceInventoryMaterialOrThrow");
        capturer.Should().Contain("EnsureDecisionTraceInventoryRowPresentOrThrow");
        recovery.Should().Contain("EnsureDecisionTraceInventoryRowPresentOrThrow");
    }

    [Fact]
    public void Suggestion210_finding_write_fail_closed_on_invalid_anchors()
    {
        string coreConverter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Findings",
                "Serialization",
                "FindingJsonConverter.cs"));
        string contractConverter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "ArchitectureFindingJsonConverter.cs"));

        coreConverter.Should().Contain("evidencePackageId in properties must be a valid GUID when present");
        contractConverter.Should().Contain("enforcementTier is required");
        contractConverter.Should().Contain("enforcementTier must be a valid tier when writing architecture findings");
    }
}
