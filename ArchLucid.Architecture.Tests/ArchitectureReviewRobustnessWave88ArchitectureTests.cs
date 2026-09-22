using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-88 architecture create/review robustness suggestions 1041–1052.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave88ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1041_1047_board_pack_intelligence_runs_inspect_wizard_bundle_and_replay_openapi_409()
    {
        string boardPack = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsBoardPackController.cs"));
        string boardPackGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsBoardPackController.SealedManifestGuard.cs"));
        string intelligenceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.SealedManifestGuard.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string findingInspectGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingInspectController.SealedManifestGuard.cs"));
        string wizardGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "WizardIntakeDraftsController.SealedManifestGuard.cs"));
        string bundleGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.SealedManifestGuard.cs"));
        string replayGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReplayController.SealedManifestGuard.cs"));

        boardPack.Should().Contain("MapPilotBoardPackSealedManifestConflict");
        boardPackGuard.Should().Contain("MapPilotBoardPackSealedManifestConflict");
        intelligenceGuard.Should().Contain("MapArchitectureIntelligenceSealedManifestConflict");
        runsGuard.Should().Contain("MapRunsSealedManifestConflict");
        findingInspectGuard.Should().Contain("MapFindingInspectSealedManifestConflict");
        wizardGuard.Should().Contain("MapWizardIntakeDraftSealedManifestConflict");
        bundleGuard.Should().Contain("MapRunDetailPageBundleSealedManifestConflict");
        replayGuard.Should().Contain("MapAuthorityReplaySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1048_1050_intelligence_mutation_lineage_and_wizard_draft_blocked_reason_wiring()
    {
        string intelligenceMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-mutation-blocked-reason.ts"));
        string intelligenceApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-api-closed-loop.ts"));
        string lineageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "audit-evidence-lineage-blocked-reason.ts"));
        string lineageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "audit-evidence-lineage-api.ts"));
        string wizardBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "wizard-intake-draft-mutation-blocked-reason.ts"));
        string wizardApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "wizard-intake-draft-api.ts"));

        intelligenceMutationBlocked.Should().Contain("architectureIntelligenceRunMutationBlockedReason");
        intelligenceApi.Should().Contain("architectureIntelligenceRunMutationBlockedReason");
        lineageBlocked.Should().Contain("auditEvidenceLineageBlockedReason");
        lineageApi.Should().Contain("auditEvidenceLineageBlockedReason");
        wizardBlocked.Should().Contain("wizardIntakeDraftMutationBlockedReason");
        wizardApi.Should().Contain("wizardIntakeDraftMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1051_1052_run_detail_bundle_and_intelligence_run_model_blocked_reason_wiring()
    {
        string bundleBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-detail-page-bundle-blocked-reason.ts"));
        string bundleApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "fetch-run-detail-page-bundle-client.ts"));
        string modelBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-run-model-blocked-reason.ts"));
        string intelligenceApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-api-closed-loop.ts"));

        bundleBlocked.Should().Contain("runDetailPageBundleBlockedReason");
        bundleApi.Should().Contain("runDetailPageBundleBlockedReason");
        modelBlocked.Should().Contain("architectureIntelligenceRunModelBlockedReason");
        intelligenceApi.Should().Contain("architectureIntelligenceRunModelBlockedReason");
    }
}
