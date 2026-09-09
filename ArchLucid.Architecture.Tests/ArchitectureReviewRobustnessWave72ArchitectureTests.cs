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
        string pilotsPacks = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));
        string boardPack = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsBoardPackController.cs"));
        string boardPackGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsBoardPackController.SealedManifestGuard.cs"));
        string intelligenceRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.Run.cs"));
        string intelligenceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.SealedManifestGuard.cs"));
        string batchCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Batch.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string revokeRisk = File.ReadAllText(
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
        string intelligenceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-mutation-blocked-reason.ts"));
        string intelligenceActions = File.ReadAllText(
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
        string boardPackBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "board-pack-mutation-blocked-reason.ts"));
        string pilotPage = File.ReadAllText(
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
        string firstValueBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string manifestGrid = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ManifestDeliverableGrid.tsx"));
        string ctoRecap = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "cto-demo", "CtoDemoRecapCard.tsx"));
        string ctoClosing = File.ReadAllText(
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
        string docxBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-value-report-docx-mutation-blocked-reason.ts"));
        string onePagerBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-one-pager-mutation-blocked-reason.ts"));
        string docxButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GenerateSponsorValueReportButton.tsx"));
        string pilotPage = File.ReadAllText(
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
        string downloads = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));
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

        docxBlocked.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        onePagerBlocked.Should().Contain("sponsorOnePagerMutationBlockedReason");
        docxButton.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        pilotPage.Should().Contain("sponsorValueReportDocxMutationBlockedReason");
        downloads.Should().Contain("downloadSponsorOnePagerPdf");
        sponsorExports.Should().Contain("downloadSponsorOnePagerPdf");
        sponsorExports.Should().Contain("sponsorOnePagerMutationBlockedReason");
    }
}
