using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-84 architecture create/review robustness suggestions 993–1004.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave84ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion993_999_advisory_query_docx_ledger_remediation_diagram_and_hub_openapi_409()
    {
        string advisory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));
        string advisoryGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.SealedManifestGuard.cs"));
        string queryTrail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.Trail.cs"));
        string queryRunDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));
        string queryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.SealedManifestGuard.cs"));
        string docxExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));
        string docxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "DocxExportController.SealedManifestGuard.cs"));
        string ledger = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "TechnologyLedgerController.cs"));
        string ledgerGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "TechnologyLedgerController.SealedManifestGuard.cs"));
        string remediation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "RemediationInstancesController.cs"));
        string remediationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "RemediationInstancesController.SealedManifestGuard.cs"));
        string diagramIngest = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramIngestController.cs"));
        string diagramGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramIngestController.SealedManifestGuard.cs"));
        string evidenceHub = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "CloudResourceEvidenceHubController.cs"));
        string evidenceHubGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "CloudResourceEvidenceHubController.SealedManifestGuard.cs"));

        advisory.Should().Contain("MapAdvisorySealedManifestConflict");
        advisoryGuard.Should().Contain("MapAdvisorySealedManifestConflict");
        queryTrail.Should().Contain("MapRunQuerySealedManifestConflict");
        queryRunDetail.Should().Contain("MapRunQuerySealedManifestConflict");
        queryGuard.Should().Contain("MapRunQuerySealedManifestConflict");
        docxExport.Should().Contain("MapDocxExportSealedManifestConflict");
        docxGuard.Should().Contain("MapDocxExportSealedManifestConflict");
        ledger.Should().Contain("MapTechnologyLedgerSealedManifestConflict");
        ledgerGuard.Should().Contain("MapTechnologyLedgerSealedManifestConflict");
        remediation.Should().Contain("MapRemediationInstanceSealedManifestConflict");
        remediationGuard.Should().Contain("MapRemediationInstanceSealedManifestConflict");
        diagramIngest.Should().Contain("MapDiagramIngestSealedManifestConflict");
        diagramGuard.Should().Contain("MapDiagramIngestSealedManifestConflict");
        evidenceHub.Should().Contain("MapEvidenceHubSealedManifestConflict");
        evidenceHubGuard.Should().Contain("MapEvidenceHubSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1000_1003_pilot_pdf_and_sponsor_csv_blocked_reason_wiring()
    {
        string firstValueBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string boardPackBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "board-pack-mutation-blocked-reason.ts"));
        string onePagerBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-one-pager-mutation-blocked-reason.ts"));
        string roiCsvBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-roi-csv-export-mutation-blocked-reason.ts"));
        string reportsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));
        string roiCsvApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-sponsor-roi-csv-export.ts"));

        firstValueBlocked.Should().Contain("firstValueReportMutationBlockedReason");
        boardPackBlocked.Should().Contain("boardPackMutationBlockedReason");
        onePagerBlocked.Should().Contain("sponsorOnePagerMutationBlockedReason");
        roiCsvBlocked.Should().Contain("sponsorRoiCsvExportMutationBlockedReason");
        reportsApi.Should().Contain("firstValueReportMutationBlockedReason");
        reportsApi.Should().Contain("boardPackMutationBlockedReason");
        reportsApi.Should().Contain("sponsorOnePagerMutationBlockedReason");
        roiCsvApi.Should().Contain("sponsorRoiCsvExportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1004_value_report_docx_blocked_reason_wiring()
    {
        string valueReportBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-value-report-docx-mutation-blocked-reason.ts"));
        string exportJobs = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));

        valueReportBlocked.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        exportJobs.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
    }
}
