using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-75 architecture create/review robustness suggestions 885–896.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave75ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion885_891_pilot_governance_and_analysis_mutation_openapi_409()
    {
        string pilotDeltas = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Deltas.cs"));
        string pilotCloseout = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Closeout.cs"));
        string pilotGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsController.SealedManifestGuard.cs"));
        string findingMute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingMuteController.cs"));
        string findingMuteGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingMuteController.SealedManifestGuard.cs"));
        string consultingDocxAsync = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.ConsultingDocx.AsyncRecommend.cs"));
        string analysisGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AnalysisReportsController.SealedManifestGuard.cs"));
        string governanceDryRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PolicyPacks.DryRun.cs"));
        string governanceSimulate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PolicyPacks.Simulate.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.SealedManifestGuard.cs"));

        pilotDeltas.Should().Contain("GetPilotRunDeltas");
        pilotDeltas.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotCloseout.Should().Contain("PostCloseout");
        pilotCloseout.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        findingMute.Should().Contain("PostMuteAsync");
        findingMute.Should().Contain("EnsureFindingMuteRunSealedManifestAllowedAsync");
        findingMuteGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        consultingDocxAsync.Should().Contain("DownloadConsultingDocxAsync");
        consultingDocxAsync.Should().Contain("EnsureRunAnalysisSealedManifestAllowedAsync");
        analysisGuard.Should().Contain("EnsureRunAnalysisSealedManifestAllowedAsync");
        governanceDryRun.Should().Contain("DryRunPolicyPack");
        governanceDryRun.Should().Contain("DryRunProposedPolicyPack");
        governanceDryRun.Should().Contain("EnsureDryRunRunIdsSealedManifestReadAllowedAsync");
        governanceDryRun.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        governanceSimulate.Should().Contain("Simulate");
        governanceSimulate.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        governanceSimulate.Should().Contain("ConflictException");
        governanceGuard.Should().Contain("EnsureDryRunRunIdsSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion892_894_export_and_dry_run_mutation_blocked_reason_ui_wiring()
    {
        string decisionReceiptBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "decision-receipt-mutation-blocked-reason.ts"));
        string decisionReceiptButton = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "draft-intake",
                "DecisionReceiptExportButton.tsx"));
        string terraformBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "terraform-advisory-export-mutation-blocked-reason.ts"));
        string terraformButton = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "ExportTerraformAdvisoryButton.tsx"));
        string dryRunBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-dry-run-mutation-blocked-reason.ts"));
        string dryRunModal = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceDryRunModal.tsx"));

        decisionReceiptBlocked.Should().Contain("decisionReceiptMutationBlockedReason");
        decisionReceiptButton.Should().Contain("decisionReceiptMutationBlockedReason");
        terraformBlocked.Should().Contain("terraformAdvisoryExportMutationBlockedReason");
        terraformButton.Should().Contain("terraformAdvisoryExportMutationBlockedReason");
        dryRunBlocked.Should().Contain("policyPackDryRunMutationBlockedReason");
        dryRunModal.Should().Contain("policyPackDryRunMutationBlockedReason");
    }

    [Fact]
    public void Suggestion895_896_pilot_deltas_and_finding_mute_blocked_reason_ui_wiring()
    {
        string pilotDeltasBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "pilot-run-deltas-blocked-reason.ts"));
        string pilotDeltasHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-pilot-run-deltas-query.ts"));
        string beforeAfterPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "BeforeAfterDeltaPanel.tsx"));
        string sponsorBanner = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));
        string aiReadinessGate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "runs",
                "RunDetailAiReadinessGateCard.tsx"));
        string findingMuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-mute-mutation-blocked-reason.ts"));
        string findingMuteDialog = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "QuickDecisionFindingMuteDialog.tsx"));

        pilotDeltasBlocked.Should().Contain("pilotRunDeltasBlockedReason");
        pilotDeltasHook.Should().Contain("pilotRunDeltasBlockedReason");
        beforeAfterPanel.Should().Contain("resolvePilotRunDeltasQueryErrorMessage");
        sponsorBanner.Should().Contain("resolvePilotRunDeltasQueryErrorMessage");
        aiReadinessGate.Should().Contain("resolvePilotRunDeltasQueryErrorMessage");
        findingMuteBlocked.Should().Contain("findingMuteMutationBlockedReason");
        findingMuteDialog.Should().Contain("findingMuteMutationBlockedReason");
    }
}
