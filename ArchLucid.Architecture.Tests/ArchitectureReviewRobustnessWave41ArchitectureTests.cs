using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-41 architecture create/review robustness suggestions 477–488.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave41ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion477_478_audit_evidence_lineage_and_package_409_ux()
    {
        string lineageApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit-evidence-lineage-api.ts"));
        string packageApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "audit-evidence-package-api.ts"));
        string lineageClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "audit-evidence",
                "[assessmentId]",
                "snapshots",
                "[snapshotId]",
                "controls",
                "[controlId]",
                "AuditEvidenceControlLineageClient.tsx"));

        lineageApi.Should().Contain("proxyJsonGet");
        packageApi.Should().Contain("formatAuditEvidenceSealedManifestAwareApiError");
        lineageClient.Should().Contain("auditEvidenceLineageBlockedReason");
        lineageClient.Should().Contain("audit-evidence-package-download");
    }

    [Fact]
    public void Suggestion479_485_openapi_409_declarations()
    {
        string governancePreview = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePreviewController.cs"));
        string docxExport = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));
        string consultingDocx = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.ConsultingDocx.Download.cs"));
        string pilotsBoardPack = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsBoardPackController.cs"));
        string roiController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));
        string findings = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));
        string preCommit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.cs"));

        governancePreview.Should().Contain("Status409Conflict");
        docxExport.Should().Contain("Status409Conflict");
        consultingDocx.Should().Contain("Status409Conflict");
        pilotsBoardPack.Should().Contain("Status409Conflict");
        roiController.Should().Contain("Status409Conflict");
        findings.Should().Contain("GetTraceabilityBundleZipLegacyAlias");
        findings.Should().Contain("Status409Conflict");
        preCommit.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion486_487_decision_receipt_and_trust_evidence_fail_closed()
    {
        string stampStrip = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "RunDetailReviewPackageDecisionReceiptStrip.tsx"));
        string feasibilitySection = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "RunDetailFeasibilityVerdictSection.tsx"));
        string proofChain = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunTrustEvidenceProofChain.tsx"));

        stampStrip.Should().Contain("manifestVersion={props.manifestVersion}");
        feasibilitySection.Should().Contain("manifestVersion={props.manifestVersion}");
        proofChain.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        proofChain.Should().Contain("productLinkBlockedReason");
    }

    [Fact]
    public void Suggestion488_before_after_and_board_pack_roi_409_honesty()
    {
        string beforeAfter = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "BeforeAfterDeltaPanel.tsx"));
        string boardPackApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "sponsor-roi-board-pack-api.ts"));
        string downloads = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));
        string exportConflict = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-sealed-manifest-conflict.ts"));

        beforeAfter.Should().Contain("roiSourceFreshnessDisposition");
        beforeAfter.Should().Contain("before-after-delta-roi-freshness");
        boardPackApi.Should().Contain("formatExportSealedManifestAwareApiError");
        downloads.Should().Contain("formatExportSealedManifestAwareApiError");
        exportConflict.Should().Contain("exportSealedManifestConflictMessage");
    }
}
