using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-24 architecture create/review robustness suggestions (231–240).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave24ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion231_ask_fail_closed_on_sealed_manifest_pin_inventory()
    {
        string preparer = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Services", "Ask", "AskContextPreparer.cs"));
        string askService = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Services", "Ask", "AskService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Ask", "AskGroundedRunSealedManifestGuard.cs"));
        string controller = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "AskController.cs"));

        preparer.Should().Contain("AskGroundedRunSealedManifestGuard");
        guard.Should().Contain("EnsureSingleRunReadyOrThrow");
        guard.Should().Contain("EnsureCompareRunsReadyOrThrowAsync");
        askService.Should().Contain("FindingInspectPinnedEvidenceGuard");
        controller.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion232_advisory_scan_fail_closed_on_sealed_manifest_hash()
    {
        string scheduleCore = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Advisory",
                "AdvisoryScanRunner.ScheduleCore.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Advisory", "AdvisoryScanSealedManifestGuard.cs"));

        scheduleCore.Should().Contain("AdvisoryScanSealedManifestGuard");
        guard.Should().Contain("EnsureRunSealedManifestHashOrThrow");
    }

    [Fact]
    public void Suggestion233_one_pager_run_summary_docx_fail_closed_on_sealed_receipt()
    {
        string sponsorPdf = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "SponsorOnePagerPdfBuilder.cs"));
        string runSummary = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "RunSummaryOnePagerExportService.cs"));
        string docx = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));

        sponsorPdf.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
        runSummary.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
        docx.Should().Contain("ConsultingDocxExportSealedReceiptGuard");
    }

    [Fact]
    public void Suggestion234_traceability_bundle_fail_closed_on_sealed_receipt()
    {
        string builder = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Traceability", "TraceabilityBundleBuilder.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Traceability",
                "TraceabilityBundleSealedReceiptGuard.cs"));

        builder.Should().Contain("TraceabilityBundleSealedReceiptGuard");
        guard.Should().Contain("EnsureSealedExportReceiptVerifiedOrThrowAsync");
    }

    [Fact]
    public void Suggestion235_ui_downloads_reject_json_problem_bodies()
    {
        string reports = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-reports.ts"));
        string scopedProxy = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-scoped-proxy.ts"));

        reports.Should().Contain("assertBinaryDownloadContentType");
        reports.Should().Contain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        reports.Should().Contain("application/pdf");
        scopedProxy.Should().Contain("assertBinaryDownloadContentType");
        scopedProxy.Should().Contain("expectedContentTypePrefixes");
    }

    [Fact]
    public void Suggestion236_risk_exception_create_renew_fail_closed_on_sealed_hash()
    {
        string riskExceptions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.RiskExceptions.cs"));

        riskExceptions.Should().Contain("GovernanceDispositionSealedManifestGuard");
        riskExceptions.Should().Contain("CreateRiskExceptionAsync");
        riskExceptions.Should().Contain("RenewRiskExceptionAsync");
    }

    [Fact]
    public void Suggestion237_itsm_outbound_fail_closed_on_sealed_hash_and_inventory()
    {
        string service = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "Outbound",
                "ItsmOutboundIssueCreationService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "Outbound",
                "ItsmOutboundSealedManifestHashGuard.cs"));

        service.Should().Contain("ItsmOutboundSealedManifestHashGuard");
        guard.Should().Contain("ItsmInboundSealedManifestHashGuard");
        guard.Should().Contain("FindingInspectPinnedEvidenceGuard");
    }

    [Fact]
    public void Suggestion238_incremental_re_review_coordinators_use_pin_gate()
    {
        string clarification = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "ClarificationAnswerReReviewCoordinator.cs"));
        string recommendation = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "ArchitectureIntelligence",
                "RecommendationImproveLoopCoordinator.cs"));
        string evidenceAdded = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Evidence",
                "EvidenceAddedIncrementalReReviewCoordinator.cs"));

        clarification.Should().Contain("IReRunExecuteSealedManifestPinGate");
        recommendation.Should().Contain("IReRunExecuteSealedManifestPinGate");
        evidenceAdded.Should().Contain("IReRunExecuteSealedManifestPinGate");
    }

    [Fact]
    public void Suggestion239_run_explain_and_finding_ask_fail_closed_on_sealed_hash()
    {
        string explain = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.RunExplain.cs"));
        string findingAsk = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "ArchitectureFindingAskController.cs"));

        explain.Should().Contain("SealedManifestReadGuard");
        findingAsk.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion240_export_get_diff_replay_fail_closed_on_sealed_hash_and_lineage()
    {
        string facade = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportQueryFacade.cs"));
        string replay = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "ExportReplayService.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "RunExportSealedManifestHashGuard.cs"));
        string controller = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));

        facade.Should().Contain("RunExportSealedManifestHashGuard");
        facade.Should().Contain("TryEnsureExportRunLineageAndSealedHashAsync");
        replay.Should().Contain("RunExportSealedManifestHashGuard");
        guard.Should().Contain("EnsureSealedManifestHashMatchesOrThrow");
        controller.Should().Contain("LineageUnverified");
    }
}
