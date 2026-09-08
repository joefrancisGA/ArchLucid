using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-48 architecture create/review robustness suggestions 561–572.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave48ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion561_564_retrieval_grounding_traces_and_agent_eval_openapi_409()
    {
        string runDetail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.RunDetail.cs"));
        string runProvenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Provenance.cs"));
        string agentEvaluation = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunAgentEvaluationController.cs"));

        runDetail.Should().Contain("GetRunRetrievalGrounding");
        runDetail.Should().Contain("SealedManifestReadGuard");
        runDetail.Should().Contain("Status409Conflict");
        runProvenance.Should().Contain("GetRunTraces");
        runProvenance.Should().Contain("GetRunToolInvocationForensics");
        runProvenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runProvenance.Should().Contain("Status409Conflict");
        agentEvaluation.Should().Contain("GetRunAgentEvaluation");
        agentEvaluation.Should().Contain("SealedManifestReadGuard");
        agentEvaluation.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion562_565_retrieval_and_agent_forensics_sealed_manifest_aware_reads()
    {
        string runDetailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string retrievalBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-retrieval-grounding-blocked-reason.ts"));
        string retrievalSection = File.ReadAllText(
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
                "RunDetailRetrievalGroundingSection.tsx"));
        string forensicsBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-agent-forensics-blocked-reason.ts"));
        string forensicsSection = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunAgentForensicsSection.tsx"));

        runDetailArtifacts.Should().Contain("getRunRetrievalGrounding");
        runDetailArtifacts.Should().Contain("getRunTraces");
        runDetailArtifacts.Should().Contain("getRunToolInvocationForensics");
        runDetailArtifacts.Should().Contain("getRunAgentEvaluation");
        runDetailArtifacts.Should().Contain("apiGetSealedManifestAware");
        retrievalBlockedReason.Should().Contain("runRetrievalGroundingBlockedReason");
        retrievalSection.Should().Contain("runRetrievalGroundingBlockedReason");
        forensicsBlockedReason.Should().Contain("runAgentForensicsBlockedReason");
        forensicsSection.Should().Contain("runAgentForensicsBlockedReason");
    }

    [Fact]
    public void Suggestion566_568_compare_subpanels_fail_closed()
    {
        string findingCorrelationQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-finding-correlation-query.ts"));
        string findingCorrelationBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "compare-finding-correlation-blocked-reason.ts"));
        string governanceDiffQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-governance-diff-query.ts"));
        string governanceDiffBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "compare-governance-diff-blocked-reason.ts"));
        string replayCostSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "ArchitectureComparisonReplayCostSection.tsx"));
        string replayCostBlockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "comparison-replay-cost-blocked-reason.ts"));

        findingCorrelationQuery.Should().Contain("compareFindingCorrelationBlockedReason");
        findingCorrelationBlockedReason.Should().Contain("compareFindingCorrelationBlockedReason");
        governanceDiffQuery.Should().Contain("compareGovernanceDiffBlockedReason");
        governanceDiffBlockedReason.Should().Contain("compareGovernanceDiffBlockedReason");
        replayCostSection.Should().Contain("comparisonReplayCostBlockedReason");
        replayCostBlockedReason.Should().Contain("comparisonReplayCostBlockedReason");
    }

    [Fact]
    public void Suggestion569_572_programmatic_download_consolidation()
    {
        string meetingPacket = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewMeetingPacketButton.tsx"));
        string shareMenu = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewHeaderShareMenu.tsx"));
        string sponsorExports = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorExportsSection.tsx"));
        string compareResultsPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-results-panel.ts"));
        string compareDiffStack = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelDiffStack.tsx"));
        string runPackageDownload = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-run-package.ts"));
        string architectureDocx = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-architecture-package-docx.ts"));

        meetingPacket.Should().Contain("downloadRunPackageExport");
        shareMenu.Should().Contain("downloadRunPackageExport");
        sponsorExports.Should().Contain("downloadRunPackageExport");
        compareResultsPanel.Should().Contain("downloadArchitecturePackageDocx");
        compareDiffStack.Should().Contain("handleDownloadDocx");
        runPackageDownload.Should().Contain("downloadScopedProxyFileGet");
        architectureDocx.Should().Contain("downloadScopedProxyFileGet");
    }
}
