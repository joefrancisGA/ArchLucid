using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-63 architecture create/review robustness suggestions 741–752.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave63ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion741_743_feedback_inspect_and_advisory_action_openapi_409()
    {
        string explainFeedback = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "FindingFeedbackController.cs"));
        string explainFeedbackGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "FindingFeedbackController.SealedManifestGuard.cs"));
        string architectureFeedback = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.FindingFeedback.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.SealedManifestGuard.cs"));
        string findingInspect = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingInspectController.cs"));
        string findingInspectGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingInspectController.SealedManifestGuard.cs"));
        string advisoryController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));

        explainFeedback.Should().Contain("PostFindingFeedbackAsync");
        explainFeedback.Should().Contain("Status409Conflict");
        explainFeedbackGuard.Should().Contain("EnsureRunScopedFindingFeedbackSealedManifestReadAllowedAsync");
        explainFeedbackGuard.Should().Contain("SealedManifestReadGuard");
        architectureFeedback.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        architectureFeedback.Should().Contain("Status409Conflict");
        runsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        findingInspect.Should().Contain("EnsureFindingInspectSealedManifestReadAllowedAsync");
        findingInspect.Should().Contain("Status409Conflict");
        findingInspectGuard.Should().Contain("SealedManifestReadGuard");
        advisoryController.Should().Contain("ApplyRecommendationAction");
        advisoryController.Should().Contain("Status409Conflict");
        advisoryController.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion744_746_assigned_count_llm_audit_and_temporal_graph_ui_wiring()
    {
        string assignedCountHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-assigned-to-me-findings-count-query.ts"));
        string assignedCountCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "GovernanceAssignedToMeCountBlockedCallout.tsx"));
        string navBadge = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "GovernanceAssignedToMeFindingsNavBadge.tsx"));
        string llmAuditHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-finding-llm-audit-query.ts"));
        string llmAuditBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-llm-audit-blocked-reason.ts"));
        string debugPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingInspectContextDebugPanel.tsx"));
        string graphViewer = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ArchitectureGraphViewer.tsx"));
        string temporalCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "graph",
                "ArchitectureGraphTemporalSnapshotGuardCallout.tsx"));

        assignedCountHook.Should().Contain("getGovernanceAssignedToMeFindingsCount");
        assignedCountHook.Should().Contain("governanceAssignedToMeCountBlockedReason");
        assignedCountCallout.Should().Contain("governance-assigned-to-me-count-blocked");
        navBadge.Should().Contain("GovernanceAssignedToMeCountBlockedCallout");
        llmAuditHook.Should().Contain("findingLlmAuditBlockedReason");
        llmAuditBlocked.Should().Contain("findingLlmAuditBlockedReason");
        debugPanel.Should().Contain("FindingInspectLlmAuditBlockedCallout");
        graphViewer.Should().Contain("ArchitectureGraphTemporalSnapshotGuardCallout");
        graphViewer.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        temporalCallout.Should().Contain("architecture-graph-temporal-snapshot-blocked");
    }

    [Fact]
    public void Suggestion747_750_retrieval_explanation_seal_delta_and_advisory_bootstrap_ui_wiring()
    {
        string retrievalHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-retrieval-grounding-query.ts"));
        string explanationLoader = File.ReadAllText(
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
                "load-run-detail-explanation-summary.ts"));
        string sealDeltaHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-seal-delta-query.ts"));
        string advisoryScans = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "AdvisoryScansContent.tsx"));
        string advisoryContent = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "use-advisory-scans-content.ts"));

        retrievalHook.Should().Contain("runRetrievalGroundingBlockedReason");
        explanationLoader.Should().Contain("explainRunBlockedReason");
        sealDeltaHook.Should().Contain("architectureSealDeltaBlockedReason");
        advisoryContent.Should().Contain("bootstrapBlockedReason");
        advisoryScans.Should().Contain("advisory-scans-bootstrap-blocked");
        advisoryScans.Should().Contain("advisoryRunReadBlockedReason");
    }

    [Fact]
    public void Suggestion751_752_evidence_trail_and_sealed_records_compare_fallback_ui_wiring()
    {
        string evidenceTrail = File.ReadAllText(
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
        string enrichRows = File.ReadAllText(
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
        string compareFallbackHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-prior-same-request-compare-fallback-query.ts"));
        string compareFallbackCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "compare",
                "PriorSameRequestCompareFallbackBlockedCallout.tsx"));
        string postCommitHint = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "PostCommitAdvancedAnalysisHint.tsx"));

        evidenceTrail.Should().Contain("explainRunBlockedReason");
        evidenceTrail.Should().Contain("evidence-trail-trace-blocked");
        enrichRows.Should().Contain("governanceSealedManifestBlockedReason");
        compareFallbackHook.Should().Contain("runSummaryBlockedReason");
        compareFallbackCallout.Should().Contain("prior-same-request-compare-fallback-blocked");
        postCommitHint.Should().Contain("PriorSameRequestCompareFallbackBlockedCallout");
    }
}
