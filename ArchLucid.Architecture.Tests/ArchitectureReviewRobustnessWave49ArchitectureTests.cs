using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-49 architecture create/review robustness suggestions 573–584.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave49ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion573_577_page_bundles_run_detail_graph_and_registers_openapi_409()
    {
        string criticalBundle = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunDetailPageBundleController.Critical.cs"));
        string workspaceBundle = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunDetailPageBundleController.WorkspaceContext.cs"));
        string sealedGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunDetailPageBundleController.SealedManifestGuard.cs"));
        string authorityReads = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string runDetailQuery = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.RunDetail.cs"));
        string reviewGraph = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "GraphController.ReviewGraph.cs"));
        string registersController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Registers.cs"));
        string registersGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Governance", "Stickiness", "GovernanceStickinessFacade.RegistersSealedManifestGuard.cs"));

        criticalBundle.Should().Contain("GetCriticalPageBundle");
        criticalBundle.Should().Contain("EnsureSealedManifestReadAllowed");
        criticalBundle.Should().Contain("Status409Conflict");
        workspaceBundle.Should().Contain("GetWorkspaceContextBundle");
        workspaceBundle.Should().Contain("EnsureSealedManifestReadAllowed");
        workspaceBundle.Should().Contain("Status409Conflict");
        sealedGuard.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("GetRunDetail");
        authorityReads.Should().Contain("Status409Conflict");
        runDetailQuery.Should().Contain("GetBuyerRunDetailSummary");
        runDetailQuery.Should().Contain("Status409Conflict");
        reviewGraph.Should().Contain("GetArchitectureGraph");
        reviewGraph.Should().Contain("GetArchitectureGraphNodesPage");
        reviewGraph.Should().Contain("SealedManifestReadGuard");
        reviewGraph.Should().Contain("Status409Conflict");
        registersController.Should().Contain("GetRiskRegister");
        registersController.Should().Contain("GetFindingsRegistersBundle");
        registersController.Should().Contain("GetDecisionRegister");
        registersController.Should().Contain("Status409Conflict");
        registersGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion578_581_sealed_manifest_aware_reads_and_blocked_reason_helpers()
    {
        string pageBundleClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "fetch-run-detail-page-bundle-client.ts"));
        string pageBundleBlockedReason = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-detail-page-bundle-blocked-reason.ts"));
        string runDetailArtifacts = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string runDetailList = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string graphApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string graphBlockedReason = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph", "evidence-graph-blocked-reason.ts"));
        string registersApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-registers.ts"));
        string registersBlockedReason = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-registers-blocked-reason.ts"));

        pageBundleClient.Should().Contain("apiGetSealedManifestAware");
        pageBundleClient.Should().Contain("fetchRunDetailCriticalPageBundle");
        pageBundleClient.Should().Contain("fetchRunDetailWorkspaceContextBundle");
        pageBundleBlockedReason.Should().Contain("runDetailPageBundleBlockedReason");
        runDetailArtifacts.Should().Contain("getRunDetail");
        runDetailArtifacts.Should().Contain("apiGetSealedManifestAware");
        runDetailList.Should().Contain("getBuyerRunDetailSummary");
        runDetailList.Should().Contain("apiGetSealedManifestAware");
        graphApi.Should().Contain("getArchitectureGraph");
        graphApi.Should().Contain("apiGetSealedManifestAware");
        graphBlockedReason.Should().Contain("evidenceGraphBlockedReason");
        registersApi.Should().Contain("apiGetSealedManifestAware");
        registersBlockedReason.Should().Contain("governanceRegistersBlockedReason");
    }

    [Fact]
    public void Suggestion582_workspace_context_and_page_bundle_fail_closed_ux()
    {
        string deferredModel = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "load-run-detail-deferred-model.ts"));
        string fetchErrorView = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "RunDetailPageFetchErrorView.tsx"));
        string graphError = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "GraphBuyerEvidenceTrailError.tsx"));
        string findingsFetch = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "governance", "findings", "governance-findings-query-fetch.ts"));
        string decisionRegisterQuery = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-decision-register-query.ts"));

        deferredModel.Should().Contain("workspaceContextBundleBlockedReason");
        fetchErrorView.Should().Contain("runDetailPageBundleBlockedReason");
        graphError.Should().Contain("evidenceGraphBlockedReason");
        findingsFetch.Should().Contain("governanceRegistersBlockedReason");
        decisionRegisterQuery.Should().Contain("governanceRegistersBlockedReason");
    }

    [Fact]
    public void Suggestion583_584_programmatic_download_consolidation()
    {
        string artifactsExports = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "RunDetailArtifactsExportsSection.tsx"));
        string decisionButton = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "draft-intake", "DecisionReceiptExportButton.tsx"));
        string aiReadinessCard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailAiReadinessGateCard.tsx"));
        string retrievalSummaryCard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunRetrievalGroundingSummaryCard.tsx"));
        string architectureRequestDownload = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-architecture-request.ts"));
        string draftReceiptDownload = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-draft-decision-receipt.ts"));
        string retrievalJsonDownload = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-retrieval-grounding-json.ts"));

        artifactsExports.Should().Contain("downloadArchitectureRequestJson");
        decisionButton.Should().Contain("downloadRunDecisionReceiptJson");
        decisionButton.Should().Contain("downloadDraftDecisionReceiptJson");
        aiReadinessCard.Should().Contain("downloadPilotFirstValueReportMarkdown");
        retrievalSummaryCard.Should().Contain("downloadRunRetrievalGroundingJson");
        architectureRequestDownload.Should().Contain("downloadScopedProxyFileGet");
        draftReceiptDownload.Should().Contain("downloadScopedProxyFileGet");
        retrievalJsonDownload.Should().Contain("downloadScopedProxyFileGet");
    }
}
