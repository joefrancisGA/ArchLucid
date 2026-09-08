using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-43 architecture create/review robustness suggestions 501–512.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave43ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion501_504_scoped_proxy_and_audit_export_409_ux()
    {
        string scopedProxy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-scoped-proxy.ts"));
        string auditApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "audit-api.ts"));
        string auditBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit", "audit-export-blocked-reason.ts"));
        string runScopedExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunScopedAuditExportButton.tsx"));
        string auditPage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "audit",
                "_sections",
                "AuditPageView.tsx"));

        scopedProxy.Should().Contain("formatExportSealedManifestAwareApiError");
        auditApi.Should().Contain("formatExportSealedManifestAwareApiError");
        auditApi.Should().Contain("triggerBrowserBlobDownload");
        auditBlockedReason.Should().Contain("auditExportBlockedReason");
        runScopedExport.Should().Contain("auditExportBlockedReason");
        auditPage.Should().Contain("auditExportBlockedReason");
    }

    [Fact]
    public void Suggestion505_508_ask_and_finding_explain_fail_closed()
    {
        string askRecovery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "ask-sse-recovery.ts"));
        string askBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "ask", "ask-blocked-reason.ts"));
        string askMainPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "ask-review-questions",
                "_sections",
                "AskMainPanel.tsx"));
        string findingAskPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingAskInlinePanel.tsx"));
        string findingAskBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-ask-blocked-reason.ts"));
        string findingExplain = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "explain", "finding-explain-blocked-reason.ts"));
        string findingExplainPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "FindingExplainPanel.tsx"));
        string findingLlmAudit = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ExplanationController.FindingExplain.cs"));

        askRecovery.Should().Contain("formatAskStreamHttpError");
        askBlockedReason.Should().Contain("askBlockedReason");
        askMainPanel.Should().Contain("askBlockedReason");
        findingAskPanel.Should().Contain("findingAskBlockedReason");
        findingAskBlockedReason.Should().Contain("findingAskBlockedReason");
        findingExplain.Should().Contain("findingExplainBlockedReason");
        findingExplainPanel.Should().Contain("findingExplainBlockedReason");
        findingLlmAudit.Should().Contain("GetFindingLlmAudit");
        findingLlmAudit.Should().Contain("Status409Conflict");
        findingLlmAudit.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion509_511_roi_freshness_and_openapi_409()
    {
        string pilotReport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "PilotValueReport.cs"));
        string pilotService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "PilotValueReportService.cs"));
        string exportControls = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "sponsor-report",
                "_sections",
                "PilotValueReportExportControls.tsx"));
        string pilotPage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "sponsor-report",
                "_sections",
                "use-pilot-value-report-pilot-page.ts"));
        string roiController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Roi", "RoiController.cs"));

        pilotReport.Should().Contain("RoiSourceFreshnessDisposition");
        pilotService.Should().Contain("RoiSourceFreshnessDisposition");
        exportControls.Should().Contain("roiSourceFreshnessDisposition");
        pilotPage.Should().Contain("formatExportSealedManifestAwareApiError");
        roiController.Should().Contain("GetSponsorReportAsync");
        roiController.Should().Contain("GetSponsorReportHistoryAsync");
        roiController.Should().Contain("GetSponsorReportExportAsync");
        roiController.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion512_anchor_export_consolidation()
    {
        string auditApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "audit-api.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string sponsorBoardPack = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "sponsor-roi-board-pack-api.ts"));
        string browserTrigger = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-browser.ts"));

        auditApi.Should().Contain("triggerBrowserBlobDownload");
        findingsApi.Should().Contain("triggerBrowserBlobDownload");
        sponsorBoardPack.Should().Contain("triggerBrowserBlobDownload");
        browserTrigger.Should().Contain("triggerBrowserBlobDownload");
    }
}
