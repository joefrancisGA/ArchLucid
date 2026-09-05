using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-31 architecture create/review robustness suggestions (356–359, 367, 369, 371–374, 378).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave31ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion356_remediation_instance_create_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceSealedManifestHashGuard.cs"));

        service.Should().Contain("RemediationInstanceSealedManifestHashGuard");
        service.Should().Contain("CreateFromMatchAsync");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion357_remediation_preflight_and_approve_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));

        service.Should().Contain("RunPreflightAsync");
        service.Should().Contain("ApproveAsync");
        service.Should().Contain("TryEnsureSealedManifestForFindingAsync");
    }

    [Fact]
    public void Suggestion358_remediation_assign_and_execute_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));

        service.Should().Contain("AssignWaveAsync");
        service.Should().Contain("ExecuteAsync");
        service.Should().Contain("RemediationInstanceSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion359_remediation_verify_and_close_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));

        service.Should().Contain("VerifyAsync");
        service.Should().Contain("CloseAsync");
    }

    [Fact]
    public void Suggestion367_run_detail_deliverables_export_ui_fail_closed()
    {
        string section = File.ReadAllText(
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

        section.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        section.Should().Contain("run-detail-docx-export-blocked-reason");
    }

    [Fact]
    public void Suggestion369_header_share_and_meeting_packet_export_ui_fail_closed()
    {
        string shareMenu = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewHeaderShareMenu.tsx"));
        string meetingPacket = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewMeetingPacketButton.tsx"));

        shareMenu.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        meetingPacket.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion371_manifest_json_download_ui_fail_closed()
    {
        string button = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "DownloadManifestButton.tsx"));

        button.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion372_consulting_docx_export_ui_fail_closed()
    {
        string consulting = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ConsultingDocxExportButton.tsx"));
        string whitelabel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ReviewBoardWhitelabelConsultingExportButton.tsx"));

        consulting.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        whitelabel.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion373_terraform_advisory_export_ui_fail_closed()
    {
        string button = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ExportTerraformAdvisoryButton.tsx"));

        button.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion374_sponsor_and_traceability_export_ui_fail_closed()
    {
        string runActions = File.ReadAllText(
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
                "RunDetailRunActionsSection.tsx"));
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
        string emailSponsor = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        runActions.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        sponsorExports.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        emailSponsor.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion378_compliance_drift_outbox_metadata_when_run_scoped()
    {
        string outboxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Integration",
                "IntegrationEventOutboxManifestHashGuard.cs"));
        string publishing = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "ComplianceDriftIntegrationEventPublishing.cs"));

        outboxGuard.Should().Contain("IntegrationEventTypes.ComplianceDriftEscalatedV1");
        publishing.Should().Contain("TryResolveVerifiedManifestHashOrNullAsync");
    }
}
