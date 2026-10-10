using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-131 architecture create/review robustness suggestions 1557–1568.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave131ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1557_1559_feedback_inspect_and_advisory_action_runtime_409_mappers()
    {
        string explainFeedback = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "FindingFeedbackController.cs"));
        string explainFeedbackGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "FindingFeedbackController.SealedManifestGuard.cs"));
        string architectureFeedback = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.FindingFeedback.cs"));
        string runsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.SealedManifestGuard.cs"));
        string findingInspect = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingInspectController.cs"));
        string findingInspectGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingInspectController.SealedManifestGuard.cs"));
        string advisoryController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));

        explainFeedback.Should().Contain("PostFindingFeedbackAsync");
        explainFeedback.Should().Contain("MapFindingFeedbackSealedManifestConflict");
        explainFeedbackGuard.Should().Contain("EnsureRunScopedFindingFeedbackSealedManifestReadAllowedAsync");
        architectureFeedback.Should().Contain("PostFindingFeedbackAsync");
        architectureFeedback.Should().Contain("MapRunsSealedManifestConflict");
        runsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        findingInspect.Should().Contain("GetInspectAsync");
        findingInspect.Should().Contain("MapFindingInspectSealedManifestConflict");
        findingInspectGuard.Should().Contain("SealedManifestReadGuard");
        advisoryController.Should().Contain("ApplyRecommendationAction");
        advisoryController.Should().Contain("MapAdvisorySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1560_1565_assigned_count_llm_audit_graph_explanation_and_seal_delta_ui_wiring()
    {
        string assignedCountHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-assigned-to-me-findings-count-query.ts"));
        string assignedCountCallout = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "GovernanceAssignedToMeCountBlockedCallout.tsx"));
        string navBadge = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "GovernanceAssignedToMeFindingsNavBadge.tsx"));
        string llmAuditHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-finding-llm-audit-query.ts"));
        string debugPanel = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingInspectContextDebugPanel.tsx"));
        string graphViewer = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ArchitectureGraphViewer.tsx"));
        string temporalCallout = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "graph",
                "ArchitectureGraphTemporalSnapshotGuardCallout.tsx"));
        string retrievalHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-retrieval-grounding-query.ts"));
        string explanationCollapsible = ArchitectureSourceProbe.ReadPathWithPartials(
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
                "RunDetailRunExplanationCollapsible.tsx"));
        string sealDeltaApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-seal-delta-api.ts"));
        string sealDeltaPanel = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureSealDeltaPanel.tsx"));

        assignedCountHook.Should().Contain("governanceAssignedToMeCountBlockedReason");
        assignedCountCallout.Should().Contain("governance-assigned-to-me-count-blocked");
        navBadge.Should().Contain("GovernanceAssignedToMeCountBlockedCallout");
        llmAuditHook.Should().Contain("findingLlmAuditBlockedReason");
        debugPanel.Should().Contain("FindingInspectLlmAuditBlockedCallout");
        graphViewer.Should().Contain("ArchitectureGraphTemporalSnapshotGuardCallout");
        temporalCallout.Should().Contain("architecture-graph-temporal-snapshot-blocked");
        retrievalHook.Should().Contain("runRetrievalGroundingBlockedReason");
        explanationCollapsible.Should().Contain("run-detail-explanation-blocked-reason");
        sealDeltaApi.Should().Contain("apiGet");
        sealDeltaApi.Should().Contain("architectureSealDeltaBlockedReason");
        sealDeltaPanel.Should().Contain("architecture-seal-delta-blocked-reason");
        sealDeltaPanel.Should().Contain("architectureSealDeltaBlockedReason");
    }

    [Fact]
    public void Suggestion1566_1568_advisory_evidence_trail_and_compare_fallback_ui_wiring()
    {
        string advisoryScans = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "AdvisoryScansContent.tsx"));
        string advisoryContent = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "use-advisory-scans-content.ts"));
        string evidenceTrail = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "EvidenceTrailTracePanel.tsx"));
        string enrichRows = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "sealed-records",
                "_sections",
                "enrich-signed-records-list-rows.ts"));
        string compareFallbackHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-prior-same-request-compare-fallback-query.ts"));
        string compareFallbackCallout = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "compare",
                "PriorSameRequestCompareFallbackBlockedCallout.tsx"));
        string postCommitHint = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "PostCommitAdvancedAnalysisHint.tsx"));

        advisoryContent.Should().Contain("bootstrapBlockedReason");
        advisoryScans.Should().Contain("advisory-scans-bootstrap-blocked");
        evidenceTrail.Should().Contain("evidence-trail-trace-blocked");
        enrichRows.Should().Contain("governanceSealedManifestBlockedReason");
        compareFallbackHook.Should().Contain("runSummaryBlockedReason");
        compareFallbackCallout.Should().Contain("prior-same-request-compare-fallback-blocked");
        postCommitHint.Should().Contain("PriorSameRequestCompareFallbackBlockedCallout");
    }
}
