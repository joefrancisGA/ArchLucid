using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-40 architecture create/review robustness suggestions 465–476.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave40ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion465_468_infra_evidence_sealed_manifest_409_formatters()
    {
        string askApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "infra-evidence", "infra-evidence-ask-api.ts"));
        string hubApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "infra-evidence", "infra-evidence-hub-api.ts"));
        string driftApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "infra-evidence", "infra-evidence-drift-api.ts"));
        string mermaidApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "infra-evidence", "infra-evidence-mermaid-api.ts"));

        askApi.Should().Contain("formatInfraEvidenceSealedManifestAwareApiError");
        hubApi.Should().Contain("formatInfraEvidenceSealedManifestAwareApiError");
        driftApi.Should().Contain("formatInfraEvidenceSealedManifestAwareApiError");
        mermaidApi.Should().Contain("formatInfraEvidenceSealedManifestAwareApiError");
    }

    [Fact]
    public void Suggestion469_470_holistic_critic_and_email_sponsor_ui_fail_closed()
    {
        string holisticBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "explain", "holistic-critic-blocked-reason.ts"));
        string holisticPanel = File.ReadAllText(
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
                "RunDetailHolisticCriticPanel.tsx"));
        string emailActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        holisticBlocked.Should().Contain("holisticCriticBlockedReason");
        holisticPanel.Should().Contain("holisticCriticBlockedReason");
        emailActions.Should().Contain("email-run-to-sponsor-secondary-link-blocked");
        emailActions.Should().Contain("collateralExportBlockedReason");
    }

    [Fact]
    public void Suggestion471_474_roi_freshness_ui_and_verdict()
    {
        string handoffCard = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "pilots", "PilotRoiValidationHandoffCard.tsx"));
        string handoffLib = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "pilot-roi-validation-handoff.ts"));
        string sponsorSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorRoiSummarySection.tsx"));
        string aiGate = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunDetailAiReadinessGateCard.tsx"));

        handoffCard.Should().Contain("roiSourceFreshnessDisposition");
        handoffLib.Should().Contain("roiSourceFreshnessDisposition");
        sponsorSection.Should().Contain("usePilotRunDeltasQuery");
        sponsorSection.Should().Contain("exec-roi-scoped-freshness-strip");
        aiGate.Should().Contain("roiSourceFreshnessDisposition");
    }

    [Fact]
    public void Suggestion475_476_reference_evidence_admin_export_guards_and_openapi_409()
    {
        string exportService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "ReferenceEvidenceAdminExportService.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "ReferenceEvidenceAdminController.cs"));
        string factory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Admin", "ReferenceEvidenceAdminZipResultFactory.cs"));

        exportService.Should().Contain("AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow");
        exportService.Should().Contain("RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync");
        controller.Should().Contain("Status409Conflict");
        factory.Should().Contain("ConflictProblem");
    }
}
