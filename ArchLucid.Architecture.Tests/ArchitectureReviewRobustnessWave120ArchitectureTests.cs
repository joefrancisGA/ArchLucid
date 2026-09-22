using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-120 architecture create/review robustness suggestions 1425–1436.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave120ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1425_1432_pilot_sponsor_collateral_sealed_manifest_mappers()
    {
        string pilotPacks = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));

        pilotPacks.Should().Contain("GetExecutiveReviewPacket");
        pilotPacks.Should().Contain("GetSponsorProofPackZip");
        pilotPacks.Should().Contain("GetFirstValueReport");
        pilotPacks.Should().Contain("PostFirstValueReportPdf");
        pilotPacks.Should().Contain("PostSponsorOnePager");
        pilotPacks.Should().Contain("PostSponsorPackSent");
        pilotPacks.Should().Contain("PostSponsorPreliminaryShare");
        pilotPacks.Should().Contain("MapPilotPackSealedManifestConflict");
        pilotGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotGuard.Should().Contain("MapPilotPackSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1433_1435_sponsor_collateral_programmatic_download_and_banner_blocked_reason_wiring()
    {
        string pilotsCollateralApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "pilots-collateral-download-api.ts"));
        string pilotsCollateralBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "pilots-collateral-mutation-blocked-reason.ts"));
        string reportsDownload = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-blob-trigger-reports.ts"));
        string exportJobsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));
        string firstValueBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string sponsorSentBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-pack-sent-mutation-blocked-reason.ts"));
        string exportActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string sponsorBannerHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));

        pilotsCollateralApi.Should().Contain("downloadSponsorProofPackZip");
        pilotsCollateralApi.Should().Contain("downloadSponsorReviewPacketMarkdown");
        pilotsCollateralApi.Should().Contain("downloadPilotFirstValueReportMarkdown");
        pilotsCollateralApi.Should().Contain("pilotsCollateralMutationBlockedReason");
        pilotsCollateralBlocked.Should().Contain("pilotsCollateralMutationBlockedReason");
        reportsDownload.Should().Contain("downloadFirstValueReportPdf");
        reportsDownload.Should().Contain("firstValueReportMutationBlockedReason");
        exportJobsApi.Should().Contain("markSponsorPackSent");
        exportJobsApi.Should().Contain("sponsorPackSentMutationBlockedReason");
        firstValueBlocked.Should().Contain("firstValueReportMutationBlockedReason");
        sponsorSentBlocked.Should().Contain("sponsorPackSentMutationBlockedReason");
        exportActions.Should().Contain("email-run-to-sponsor-export-blocked-reason");
        exportActions.Should().Contain("pilotsCollateralMutationBlockedReason");
        sponsorBannerHook.Should().Contain("firstValueReportMutationBlockedReason");
        sponsorBannerHook.Should().Contain("sponsorPackSentMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1436_sponsor_collateral_programmatic_test_parity()
    {
        string sponsorBannerTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorBanner.test.tsx"));
        string sponsorBanner = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorBanner.tsx"));
        string exportActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));

        sponsorBannerTest.Should().Contain("programmatic secondary export actions");
        sponsorBannerTest.Should().Contain("programmatic sponsor DOCX download action");
        sponsorBannerTest.Should().Contain("email-run-to-sponsor-mark-sent-blocked-reason");
        sponsorBannerTest.Should().Contain("getByRole(\"button\"");
        sponsorBanner.Should().Contain("email-run-to-sponsor-mark-sent-blocked-reason");
        exportActions.Should().Contain("downloadPilotFirstValueReportMarkdown");
        exportActions.Should().NotContain("href=\"/api/proxy/v1/pilots/runs/");
    }
}
