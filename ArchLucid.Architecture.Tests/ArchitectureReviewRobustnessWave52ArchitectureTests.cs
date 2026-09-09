using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-52 architecture create/review robustness suggestions 609–620.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave52ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion609_614_run_findings_ai_provenance_advisory_comparisons_and_forensics_openapi_409()
    {
        string findings = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));
        string aiRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.Run.cs"));
        string provenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceController.cs"));
        string advisory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));
        string comparisons = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.History.cs"));
        string forensics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.cs"));

        findings.Should().Contain("ListRunFindings");
        findings.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        findings.Should().Contain("Status409Conflict");
        aiRun.Should().Contain("GetRunModelAsync");
        aiRun.Should().Contain("SealedManifestReadGuard");
        aiRun.Should().Contain("Status409Conflict");
        provenance.Should().Contain("GetFullGraph");
        provenance.Should().Contain("GetDecisionGraph");
        provenance.Should().Contain("GetNodeNeighborhood");
        provenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        provenance.Should().Contain("Status409Conflict");
        advisory.Should().Contain("GetImprovements");
        advisory.Should().Contain("ListRecommendations");
        advisory.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        advisory.Should().Contain("Status409Conflict");
        comparisons.Should().Contain("GetRunComparisonHistory");
        comparisons.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        comparisons.Should().Contain("Status409Conflict");
        forensics.Should().Contain("GetRunTraceForensics");
        forensics.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        forensics.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion615_618_sealed_manifest_aware_reads_and_blocked_reason_helpers()
    {
        string architectureRequestList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string architectureRequestBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "architecture-request-blocked-reason.ts"));
        string learningEvolution = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "learning-evolution-api.ts"));
        string advisoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory-api.ts"));
        string advisoryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory", "advisory-run-read-blocked-reason.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph", "provenance-graph-alias-blocked-reason.ts"));
        string closedLoopApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-intelligence-api-closed-loop.ts"));
        string aiRunModelBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-model-blocked-reason.ts"));
        string findingProvenance = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-provenance.ts"));
        string findingProvenanceBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-provenance-blocked-reason.ts"));

        architectureRequestList.Should().Contain("getArchitectureRequest");
        architectureRequestList.Should().Contain("apiGetSealedManifestAware");
        architectureRequestBlocked.Should().Contain("architectureRequestBlockedReason");
        learningEvolution.Should().Contain("getImprovementPlan");
        learningEvolution.Should().Contain("apiGetSealedManifestAware");
        advisoryApi.Should().Contain("listRecommendations");
        advisoryApi.Should().Contain("apiGetSealedManifestAware");
        advisoryBlocked.Should().Contain("advisoryRunReadBlockedReason");
        graphApi.Should().Contain("getProvenanceGraph");
        graphApi.Should().Contain("/v1/provenance/runs/");
        graphApi.Should().Contain("apiGetSealedManifestAware");
        provenanceBlocked.Should().Contain("provenanceGraphAliasBlockedReason");
        closedLoopApi.Should().Contain("fetchArchitectureIntelligenceRunModel");
        closedLoopApi.Should().Contain("apiGetSealedManifestAware");
        aiRunModelBlocked.Should().Contain("architectureIntelligenceRunModelBlockedReason");
        findingProvenance.Should().Contain("apiGetSealedManifestAware");
        findingProvenance.Should().Contain("findingProvenanceBlockedReason");
        findingProvenanceBlocked.Should().Contain("findingProvenanceBlockedReason");
    }

    [Fact]
    public void Suggestion619_compare_picked_summary_fail_closed_ux()
    {
        string compareFormFetch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-form-fetch.ts"));
        string comparePickers = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareRunPickersSection.tsx"));
        string compareForm = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareForm.tsx"));

        compareFormFetch.Should().Contain("leftSummaryBlockedReason");
        compareFormFetch.Should().Contain("rightSummaryBlockedReason");
        comparePickers.Should().Contain("compare-left-summary-blocked-reason");
        comparePickers.Should().Contain("compare-right-summary-blocked-reason");
        compareForm.Should().Contain("leftSummaryBlockedReason");
        compareForm.Should().Contain("rightSummaryBlockedReason");
    }

    [Fact]
    public void Suggestion620_sponsor_collateral_programmatic_actions_test_parity()
    {
        string sponsorBannerTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorBanner.test.tsx"));
        string sponsorExportActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        sponsorBannerTest.Should().Contain("programmatic secondary export actions");
        sponsorBannerTest.Should().Contain("programmatic sponsor DOCX download action");
        sponsorBannerTest.Should().Contain("getByRole(\"button\"");
        sponsorExportActions.Should().Contain("downloadPilotFirstValueReportMarkdown");
        sponsorExportActions.Should().NotContain("href=\"/api/proxy/v1/pilots/runs/");
    }
}
