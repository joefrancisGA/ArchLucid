using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-81 architecture create/review robustness suggestions 957–968.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave81ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion957_963_finding_audit_precommit_and_infra_audit_openapi_409()
    {
        string findingAssignment = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.cs"));
        string findingAssignmentGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.SealedManifestGuard.cs"));
        string auditExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Download.cs"));
        string auditCsv = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Csv.cs"));
        string auditGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.SealedManifestGuard.cs"));
        string preCommit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.cs"));
        string preCommitGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.SealedManifestGuard.cs"));
        string infraAsk = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceAskController.cs"));
        string infraAskGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceAskController.SealedManifestGuard.cs"));
        string auditLineage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "AuditEvidenceLineageController.cs"));
        string auditLineageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "AuditEvidenceLineageController.SealedManifestGuard.cs"));
        string auditPackage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "AuditEvidencePackageController.cs"));
        string auditPackageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "AuditEvidencePackageController.SealedManifestGuard.cs"));

        findingAssignment.Should().Contain("EnsureFindingRemediationAssignmentSealedManifestAllowedAsync");
        findingAssignmentGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        auditExport.Should().Contain("EnsureAuditExportSealedManifestAllowedAsync");
        auditCsv.Should().Contain("EnsureAuditExportSealedManifestAllowedAsync");
        auditGuard.Should().Contain("RunExportSealedManifestHashGuard");
        preCommit.Should().Contain("EnsurePreCommitSimulationSealedManifestAllowedAsync");
        preCommitGuard.Should().Contain("PreCommitSimulationSealedManifestHashGuard");
        infraAsk.Should().Contain("MapAskSealedManifestConflict");
        infraAskGuard.Should().Contain("MapAskSealedManifestConflict");
        auditLineage.Should().Contain("MapAuditEvidenceLineageSealedManifestConflict");
        auditLineageGuard.Should().Contain("MapAuditEvidenceLineageSealedManifestConflict");
        auditPackage.Should().Contain("MapAuditEvidencePackageSealedManifestConflict");
        auditPackageGuard.Should().Contain("MapAuditEvidencePackageSealedManifestConflict");
    }

    [Fact]
    public void Suggestion964_967_audit_package_board_pack_and_findings_csv_blocked_reason_wiring()
    {
        string packageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "audit-evidence-package-blocked-reason.ts"));
        string packageApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "audit-evidence-package-api.ts"));
        string lineageClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "audit-evidence",
                "[assessmentId]",
                "snapshots",
                "[snapshotId]",
                "controls",
                "[controlId]",
                "AuditEvidenceControlLineageClient.tsx"));
        string boardPackApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "sponsor-roi-board-pack-api.ts"));
        string findingsCsvBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "run-findings-csv-export-blocked-reason.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));

        packageBlocked.Should().Contain("auditEvidencePackageBlockedReason");
        packageApi.Should().Contain("auditEvidencePackageBlockedReason");
        lineageClient.Should().Contain("auditEvidencePackageBlockedReason");
        boardPackApi.Should().Contain("sponsorRoiBoardPackMutationBlockedReason");
        findingsCsvBlocked.Should().Contain("runFindingsCsvExportBlockedReason");
        findingsApi.Should().Contain("runFindingsCsvExportBlockedReason");
    }

    [Fact]
    public void Suggestion968_sponsor_roi_summary_blocked_reason_wiring()
    {
        string summaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "roi",
                "sponsor-roi-summary-blocked-reason.ts"));
        string summarySection = File.ReadAllText(
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

        summaryBlocked.Should().Contain("sponsorRoiSummaryBlockedReason");
        summarySection.Should().Contain("sponsorRoiSummaryBlockedReason");
    }
}
