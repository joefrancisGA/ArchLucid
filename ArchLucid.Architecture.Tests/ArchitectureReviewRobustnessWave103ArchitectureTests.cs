using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-103 architecture create/review robustness suggestions 1221–1232.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave103ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1221_1224_seed_fake_policy_pack_pilot_and_finding_verification_sealed_manifest_conflict_mappers()
    {
        string seedFake = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureDiagnosticsController.SeedFake.cs"));
        string policyMapper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Http", "Governance", "PolicyPackHttpResultMapper.cs"));
        string pilotPacks = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string findingVerification = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.cs"));

        seedFake.Should().Contain("MapInternalArchitectureDiagnosticsSealedManifestConflict");
        policyMapper.Should().Contain("MapPolicyPackSealedManifestConflict");
        pilotPacks.Should().Contain("MapPilotPackSealedManifestConflict");
        findingVerification.Should().Contain("MapFindingVerificationSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1225_1227_workspace_prior_compare_sealed_manifest_blocked_reason_mappers()
    {
        string workspaceContext = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.WorkspaceContext.cs"));
        string bundleGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.SealedManifestGuard.cs"));

        workspaceContext.Should().Contain("MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason");
        bundleGuard.Should().Contain("MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason");
    }

    [Fact]
    public void Suggestion1228_1232_seed_finding_ledger_inventory_and_coverage_blocked_reason_wiring()
    {
        string seedFakeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "internal-architecture-seed-fake-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string findingMuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-mute-mutation-blocked-reason.ts"));
        string ledgerApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "technology-ledger.ts"));
        string ledgerBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "technology-ledger-mutation-blocked-reason.ts"));
        string inventoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-inventory-binding-api.ts"));
        string inventoryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-inventory-binding-blocked-reason.ts"));
        string coverageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "coverage-preview-api.ts"));
        string coverageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-coverage-blocked-reason.ts"));

        seedFakeBlocked.Should().Contain("internalArchitectureSeedFakeMutationBlockedReason");
        lifecycleApi.Should().Contain("internalArchitectureSeedFakeMutationBlockedReason");
        findingsApi.Should().Contain("findingMuteMutationBlockedReason");
        findingMuteBlocked.Should().Contain("findingMuteMutationBlockedReason");
        ledgerApi.Should().Contain("technologyLedgerMutationBlockedReason");
        ledgerBlocked.Should().Contain("technologyLedgerMutationBlockedReason");
        inventoryApi.Should().Contain("architectureInventoryBindingBlockedReason");
        inventoryBlocked.Should().Contain("architectureInventoryBindingBlockedReason");
        coverageApi.Should().Contain("governanceScopeCoverageBlockedReason");
        coverageBlocked.Should().Contain("governanceScopeCoverageBlockedReason");
    }
}
