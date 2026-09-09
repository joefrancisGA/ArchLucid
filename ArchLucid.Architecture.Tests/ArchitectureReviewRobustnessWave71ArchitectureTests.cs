using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-71 architecture create/review robustness suggestions 837–848.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave71ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion837_842_create_replay_governance_pilot_mutation_openapi_409()
    {
        string createRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Sync.cs"));
        string asyncCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.AsyncOperations.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string authorityReplay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReplayController.cs"));
        string authorityReplayGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReplayController.SealedManifestGuard.cs"));
        string mutationCorrections = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.MutationCorrections.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.SealedManifestGuard.cs"));
        string pilotsPacks = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));

        createRun.Should().Contain("CreateRun");
        createRun.Should().Contain("EnsureArchitectureRunCreateSealedManifestAllowedAsync");
        createRun.Should().Contain("Status409Conflict");
        asyncCreate.Should().Contain("AcceptCreateRunAsync");
        asyncCreate.Should().Contain("EnsureArchitectureRunCreateSealedManifestAllowedAsync");
        asyncCreate.Should().Contain("Status409Conflict");
        runsGuard.Should().Contain("EnsureArchitectureRunCreateSealedManifestAllowedAsync");
        runsGuard.Should().Contain("DraftIntakeSealedManifestReadGuard");
        authorityReplay.Should().Contain("Replay");
        authorityReplay.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        authorityReplay.Should().Contain("Status409Conflict");
        authorityReplayGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        mutationCorrections.Should().Contain("RecordGovernanceMutationCorrection");
        mutationCorrections.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        mutationCorrections.Should().Contain("Status409Conflict");
        governanceGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        pilotsPacks.Should().Contain("PostSponsorPackSent");
        pilotsPacks.Should().Contain("PostSponsorPreliminaryShare");
        pilotsPacks.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        pilotsPacks.Should().Contain("Status409Conflict");
        pilotsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion843_846_pin_sponsor_share_and_first_value_mutation_blocked_reason_ui_wiring()
    {
        string pinBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "review-pin-mutation-blocked-reason.ts"));
        string pinHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-pin-mutation.ts"));
        string pinToggle = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "FavoriteReviewToggle.tsx"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string preliminaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-preliminary-share-mutation-blocked-reason.ts"));
        string sponsorPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureSponsorSharingPanel.tsx"));
        string packSentBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-pack-sent-mutation-blocked-reason.ts"));
        string firstValueBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "first-value-report-mutation-blocked-reason.ts"));
        string sponsorBanner = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "use-email-run-to-sponsor-banner.ts"));

        pinBlocked.Should().Contain("reviewPinMutationBlockedReason");
        pinHook.Should().Contain("reviewPinMutationBlockedReason");
        pinHook.Should().Contain("pinArchitectureRun");
        pinToggle.Should().Contain("useReviewPinMutation");
        lifecycleApi.Should().Contain("pinArchitectureRun");
        preliminaryBlocked.Should().Contain("sponsorPreliminaryShareMutationBlockedReason");
        sponsorPanel.Should().Contain("sponsorPreliminaryShareMutationBlockedReason");
        packSentBlocked.Should().Contain("sponsorPackSentMutationBlockedReason");
        firstValueBlocked.Should().Contain("firstValueReportMutationBlockedReason");
        sponsorBanner.Should().Contain("sponsorPackSentMutationBlockedReason");
        sponsorBanner.Should().Contain("firstValueReportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion847_848_comparison_docx_and_async_replay_mutation_blocked_reason_ui_wiring()
    {
        string docxBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-docx-mutation-blocked-reason.ts"));
        string comparePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-results-panel.ts"));
        string asyncReplayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-async-replay-mutation-blocked-reason.ts"));
        string replayForm = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "internal",
                "validate-route",
                "_sections",
                "use-replay-form.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));

        docxBlocked.Should().Contain("comparisonDocxMutationBlockedReason");
        comparePanel.Should().Contain("comparisonDocxMutationBlockedReason");
        asyncReplayBlocked.Should().Contain("reviewAsyncReplayMutationBlockedReason");
        replayForm.Should().Contain("reviewAsyncReplayMutationBlockedReason");
        replayForm.Should().Contain("replayArchitectureRunAsync");
        lifecycleApi.Should().Contain("replayArchitectureRunAsync");
    }
}
