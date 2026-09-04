using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-20 architecture create/review robustness suggestions (191–200).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave20ArchitectureTests
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
    public void Suggestion191_zip_export_fail_closed_when_sealed_receipt_fields_missing()
    {
        string loader = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportAuthorityMaterialLoader.cs"));

        loader.Should().Contain("TryGetSealedReceiptReadinessOutcome");
        loader.Should().Contain("SealedReceiptIncomplete");

        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportPackageBuilder.cs"));

        builder.Should().Contain("SealedReceiptIncomplete");
    }

    [Fact]
    public void Suggestion192_blob_push_fail_closed_on_sealed_receipt_mismatch()
    {
        string processor = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Coordination",
                "Export",
                "RunExportBlobPushOutboxProcessor.cs"));

        processor.Should().Contain("packageResult.IsConflict");
        processor.Should().Contain("RecordDeadLetterAsync");
    }

    [Fact]
    public void Suggestion193_missing_sealed_receipt_fields_distinct_409()
    {
        string problemTypes = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "ProblemDetails", "ProblemDetailsOptions.cs"));

        problemTypes.Should().Contain("DecisionReceiptSealedIncomplete");

        string download = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));

        download.Should().Contain("DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete");
        download.Should().Contain("ProblemTypes.DecisionReceiptSealedIncomplete");
    }

    [Fact]
    public void Suggestion194_review_board_export_verifies_sealed_receipt()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "ArchitectureReviewExportService.Hydrate.cs"));

        service.Should().Contain("EnsureSealedDecisionReceiptVerifiedOrThrowAsync");
        service.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");

        string binder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "ManifestDecisionReceiptExportBinder.cs"));

        binder.Should().Contain("BuildVerifiedExportReceipt");
    }

    [Fact]
    public void Suggestion195_run_id_compare_diffs_inventory_checked_projection()
    {
        string facade = ReadCompareRunsFacadeSources();
        string builder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ManifestCompareInventoryCheckedDocumentBuilder.cs"));

        int compareIndex = facade.IndexOf("CompareManifestsAsync", StringComparison.Ordinal);
        string compareBody = facade[compareIndex..];

        compareBody.Should().Contain("ProjectCompareManifestAsync");
        builder.Should().Contain("ManifestCompareInventoryCheckedDocumentBuilder");
    }

    [Fact]
    public void Suggestion196_end_to_end_replay_enforces_pin_and_inventory()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "EndToEndReplayComparisonService.cs"));

        service.Should().Contain("LoadScopedRunPairAsync");
        service.Should().Contain("PinFingerprintMismatch");
        service.Should().Contain("CommittedArtifactInventoryMismatch");
    }

    [Fact]
    public void Suggestion197_agent_compare_emits_input_fingerprints()
    {
        string facade = ReadCompareRunsFacadeSources();

        facade.Should().Contain("InputFingerprints = RunComparePinFingerprintGuard.BuildCompareInputFingerprints");

        string diff = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Diffs", "AgentResultDiffResult.cs"));

        diff.Should().Contain("CompareInputFingerprints? InputFingerprints");

        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Agents.cs"));

        controller.Should().Contain("inputFingerprints");
        controller.Should().Contain("LeftManifestNotFound");
    }

    [Fact]
    public void Suggestion198_recovery_binds_receipt_version_from_sealed_document()
    {
        string orchestrator = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("persistedManifest.Metadata?.Version");
    }

    [Fact]
    public void Suggestion199_export_lineage_fail_closed_on_sealed_manifest_hash()
    {
        string verifier = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportLineageVerifier.cs"));

        verifier.Should().Contain("golden.ManifestHash");
        verifier.Should().Contain("RunExportLineageVerificationStatus.Mismatch");
    }

    [Fact]
    public void Suggestion200_finding_read_fail_closed_on_invalid_anchors()
    {
        string converter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Findings",
                "Serialization",
                "FindingJsonConverter.cs"));

        converter.Should().Contain("enforcementTier is required");
        converter.Should().Contain("evidencePackageId must be a valid GUID when present");
    }
}
