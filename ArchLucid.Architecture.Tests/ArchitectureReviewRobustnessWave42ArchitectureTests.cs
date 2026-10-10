using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-42 architecture create/review robustness suggestions 489–500.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave42ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion489_495_openapi_409_declarations()
    {
        string insights = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Governance/GovernanceController.Insights.cs");
        string posture = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Governance/GovernancePostureController.cs");
        string manifestSummary = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Authority/AuthorityQueryController.Trail.cs");
        string auditDownload = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Admin/AuditController.Export.Download.cs");
        string auditCsv = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Admin/AuditController.Export.Csv.cs");
        string remediation = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Findings/FindingRemediationAssignmentController.cs");
        string replay = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Authority/AuthorityReplayController.cs");
        string ask = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Planning/AskController.cs");

        insights.Should().Contain("Status409Conflict");
        posture.Should().Contain("Status409Conflict");
        manifestSummary.Should().Contain("GetManifestSummary");
        manifestSummary.Should().Contain("Status409Conflict");
        auditDownload.Should().Contain("Status409Conflict");
        auditCsv.Should().Contain("Status409Conflict");
        remediation.Should().Contain("Status409Conflict");
        replay.Should().Contain("Status409Conflict");
        ask.Should().Contain("AskStream");
        ask.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion496_498_export_download_409_ux()
    {
        string runExport = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-run-export.ts"));
        string terraform = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-terraform.ts"));
        string findings = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string exportJobs = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));

        runExport.Should().Contain("formatExportSealedManifestAwareApiError");
        terraform.Should().Contain("formatExportSealedManifestAwareApiError");
        findings.Should().Contain("formatExportSealedManifestAwareApiError");
        exportJobs.Should().Contain("formatExportSealedManifestAwareApiError");
    }

    [Fact]
    public void Suggestion499_explain_run_fail_closed()
    {
        string blockedReason = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "explain", "explain-run-blocked-reason.ts"));
        string collapsible = File.ReadAllText(
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

        blockedReason.Should().Contain("explainRunBlockedReason");
        collapsible.Should().Contain("explainRunBlockedReason");
    }

    [Fact]
    public void Suggestion500_governance_and_manifest_sealed_hash_409_ux()
    {
        string blockedReason = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-sealed-manifest-blocked-reason.ts"));
        string overview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "GovernanceOverviewSummaryPanelShell.tsx"));
        string manifestError = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "sealed-records",
                "[manifestId]",
                "_sections",
                "ManifestDetailPageErrorViews.tsx"));

        blockedReason.Should().Contain("governanceSealedManifestBlockedReason");
        overview.Should().Contain("governanceSealedManifestBlockedReason");
        manifestError.Should().Contain("governanceSealedManifestBlockedReason");
    }
}
