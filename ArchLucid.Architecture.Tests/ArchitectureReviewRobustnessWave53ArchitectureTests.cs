using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-53 architecture create/review robustness suggestions 621–632.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave53ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion621_626_export_history_request_authority_provenance_governance_and_findings_openapi_409()
    {
        string exports = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string architectureRequest = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.ArchitectureRequests.cs"));
        string authorityProvenance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceQueryController.cs"));
        string governance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceController.PromotionsActivations.cs"));
        string findings = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));

        exports.Should().Contain("GetRunExportHistory");
        exports.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        exports.Should().Contain("Status409Conflict");
        architectureRequest.Should().Contain("GetRequest");
        architectureRequest.Should().Contain("EnsureArchitectureRequestSealedManifestReadAllowedAsync");
        architectureRequest.Should().Contain("Status409Conflict");
        authorityProvenance.Should().Contain("GetProvenanceSnapshot");
        authorityProvenance.Should().Contain("GetFullGraph");
        authorityProvenance.Should().Contain("GetDecisionGraph");
        authorityProvenance.Should().Contain("GetNodeNeighborhood");
        authorityProvenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        authorityProvenance.Should().Contain("Status409Conflict");
        governance.Should().Contain("GetApprovalRequests");
        governance.Should().Contain("GetPromotions");
        governance.Should().Contain("GetActivations");
        governance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        governance.Should().Contain("Status409Conflict");
        findings.Should().Contain("GetFindingEvidenceChain");
        findings.Should().Contain("GetFindingInspectForRun");
        findings.Should().Contain("ExportRunFindingsCsv");
        findings.Should().Contain("GetTraceabilityBundleZipCore");
        findings.Should().Contain("EnsureSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion627_628_pre_finalize_and_governance_stickiness_sealed_reads()
    {
        string preFinalizeApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "pre-finalize-checklist.ts"));
        string preFinalizeBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "pre-finalize-checklist-blocked-reason.ts"));
        string preFinalizePanel = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "PreFinalizeChecklistPanel.tsx"));
        string stickinessRegisters = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-stickiness-api-registers.ts"));
        string stickinessBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-stickiness-summary-blocked-reason.ts"));

        preFinalizeApi.Should().Contain("getPreFinalizeChecklist");
        preFinalizeApi.Should().Contain("apiGetSealedManifestAware");
        preFinalizeBlocked.Should().Contain("preFinalizeChecklistBlockedReason");
        preFinalizePanel.Should().Contain("preFinalizeChecklistBlockedReason");
        stickinessRegisters.Should().Contain("getGovernanceReviewsAwaitingAction");
        stickinessRegisters.Should().Contain("getGovernanceDecisionsNeededSummary");
        stickinessRegisters.Should().Contain("apiGetSealedManifestAware");
        stickinessBlocked.Should().Contain("governanceStickinessSummaryBlockedReason");
    }

    [Fact]
    public void Suggestion629_631_blocked_reason_hooks_for_request_advisory_and_intelligence_run_model()
    {
        string architectureRequestHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-request-query.ts"));
        string advisoryHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-advisory-recommendations-query.ts"));
        string intelligenceHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-intelligence-run-model-query.ts"));
        string architectureRequestBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "architecture-request-blocked-reason.ts"));
        string advisoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory", "advisory-run-read-blocked-reason.ts"));
        string intelligenceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-model-blocked-reason.ts"));

        architectureRequestHook.Should().Contain("architectureRequestBlockedReason");
        advisoryHook.Should().Contain("advisoryRunReadBlockedReason");
        intelligenceHook.Should().Contain("fetchArchitectureIntelligenceRunModel");
        intelligenceHook.Should().Contain("architectureIntelligenceRunModelBlockedReason");
        architectureRequestBlocked.Should().Contain("architectureRequestBlockedReason");
        advisoryBlocked.Should().Contain("advisoryRunReadBlockedReason");
        intelligenceBlocked.Should().Contain("architectureIntelligenceRunModelBlockedReason");
    }

    [Fact]
    public void Suggestion632_finding_provenance_export_history_and_authority_provenance_alias_clients()
    {
        string findingHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-finding-provenance-query.ts"));
        string exportHistoryApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-export-history-api.ts"));
        string exportHistoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "run-export-history-blocked-reason.ts"));
        string authorityProvenanceApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "authority-provenance-query-api.ts"));
        string authorityProvenanceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph", "authority-provenance-alias-blocked-reason.ts"));

        findingHook.Should().Contain("findingProvenanceBlockedReason");
        exportHistoryApi.Should().Contain("getRunExportHistory");
        exportHistoryApi.Should().Contain("apiGetSealedManifestAware");
        exportHistoryBlocked.Should().Contain("runExportHistoryBlockedReason");
        authorityProvenanceApi.Should().Contain("getAuthorityProvenanceGraph");
        authorityProvenanceApi.Should().Contain("/v1/authority/runs/");
        authorityProvenanceApi.Should().Contain("apiGetSealedManifestAware");
        authorityProvenanceBlocked.Should().Contain("authorityProvenanceAliasBlockedReason");
    }
}
