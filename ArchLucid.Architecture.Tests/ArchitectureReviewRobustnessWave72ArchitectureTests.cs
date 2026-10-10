using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-72 architecture create/review robustness suggestions 849–860.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave72ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion849_854_860_pilot_intelligence_batch_and_revoke_mutation_openapi_409()
    {
        string pilotsPacks = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));
        string boardPack = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsBoardPackController.cs"));
        string boardPackGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsBoardPackController.SealedManifestGuard.cs"));
        string intelligenceRun = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.Run.cs"));
        string intelligenceGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.SealedManifestGuard.cs"));
        string batchCreate = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Batch.cs"));
        string runsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string revokeRisk = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Findings.RiskExceptions.cs"));

        pilotsPacks.Should().Contain("PostFirstValueReportPdf");
        pilotsPacks.Should().Contain("PostSponsorOnePager");
        pilotsPacks.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotsPacks.Should().Contain("Status409Conflict");
        pilotsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        boardPack.Should().Contain("PostBoardPackPdf");
        boardPack.Should().Contain("EnsureBoardPackSealedManifestReadAllowedAsync");
        boardPack.Should().Contain("Status409Conflict");
        boardPackGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        intelligenceRun.Should().Contain("PostRunAsync");
        intelligenceRun.Should().Contain("PostContinueAsync");
        intelligenceRun.Should().Contain("PostPublishAsync");
        intelligenceRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        intelligenceRun.Should().Contain("EnsureArchitectureIntelligenceRunCreateSealedManifestAllowedAsync");
        intelligenceRun.Should().Contain("Status409Conflict");
        intelligenceGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        intelligenceGuard.Should().Contain("DraftIntakeSealedManifestReadGuard");
        batchCreate.Should().Contain("CreateRunBatch");
        batchCreate.Should().Contain("EnsureArchitectureRunCreateSealedManifestAllowedAsync");
        batchCreate.Should().Contain("Status409Conflict");
        runsGuard.Should().Contain("EnsureArchitectureRunCreateSealedManifestAllowedAsync");
        revokeRisk.Should().Contain("RevokeRiskExceptionAsync");
        revokeRisk.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion855_857_intelligence_board_pack_and_first_value_mutation_blocked_reason_ui_wiring()
    {
        string intelligenceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-mutation-blocked-reason.ts"));
        string intelligenceActions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "use-architecture-intelligence-actions.ts"));
        string boardPackBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "board-pack-mutation-blocked-reason.ts"));
        string pilotPage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "sponsor-report",
                "_sections",
                "use-pilot-value-report-pilot-page.ts"));
        string firstValueBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string manifestGrid = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string ctoRecap = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "cto-demo", "CtoDemoRecapCard.tsx"));
        string ctoClosing = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "cto-demo", "CtoDemoAuditClosingBeat.tsx"));

        intelligenceBlocked.Should().Contain("architectureIntelligenceRunMutationBlockedReason");
        intelligenceActions.Should().Contain("architectureIntelligenceRunMutationBlockedReason");
        boardPackBlocked.Should().Contain("boardPackMutationBlockedReason");
        pilotPage.Should().Contain("boardPackMutationBlockedReason");
        firstValueBlocked.Should().Contain("firstValueReportMutationBlockedReason");
        manifestGrid.Should().Contain("firstValueReportMutationBlockedReason");
        ctoRecap.Should().Contain("firstValueReportMutationBlockedReason");
        ctoClosing.Should().Contain("firstValueReportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion858_859_sponsor_docx_and_one_pager_mutation_blocked_reason_ui_wiring()
    {
        string docxBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-value-report-docx-mutation-blocked-reason.ts"));
        string onePagerBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-one-pager-mutation-blocked-reason.ts"));
        string docxButton = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GenerateSponsorValueReportButton.tsx"));
        string pilotPage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "sponsor-report",
                "_sections",
                "use-pilot-value-report-pilot-page.ts"));
        string downloads = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));
        string sponsorExports = ArchitectureSourceProbe.ReadPathWithPartials(
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

        docxBlocked.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        onePagerBlocked.Should().Contain("sponsorOnePagerMutationBlockedReason");
        docxButton.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        pilotPage.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        downloads.Should().Contain("downloadSponsorOnePagerPdf");
        sponsorExports.Should().Contain("downloadSponsorOnePagerPdf");
        sponsorExports.Should().Contain("sponsorOnePagerMutationBlockedReason");
    }
}
