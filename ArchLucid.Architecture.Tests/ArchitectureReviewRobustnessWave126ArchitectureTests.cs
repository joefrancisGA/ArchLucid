using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-126 architecture create/review robustness suggestions 1497–1508.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave126ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1497_1502_setup_resolution_catalog_and_register_sealed_manifest_mappers()
    {
        string setupController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceSetupController.cs"));
        string setupGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceSetupController.SealedManifestGuard.cs"));
        string resolutionController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceResolutionController.cs"));
        string resolutionGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceResolutionController.SealedManifestGuard.cs"));
        string catalogController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.cs"));
        string catalogGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.SealedManifestGuard.cs"));
        string registersController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Registers.cs"));
        string attestationController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Attestation.cs"));

        setupController.Should().Contain("GetSetupGuideBundle");
        setupController.Should().Contain("MapGovernanceSetupSealedManifestConflict");
        setupGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        setupGuard.Should().Contain("MapGovernanceSetupSealedManifestConflict");
        resolutionController.Should().Contain("Resolve");
        resolutionController.Should().Contain("MapGovernanceResolutionSealedManifestConflict");
        resolutionGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        resolutionGuard.Should().Contain("MapGovernanceResolutionSealedManifestConflict");
        catalogController.Should().Contain("Get");
        catalogController.Should().Contain("MapGovernanceEnvironmentCatalogSealedManifestConflict");
        catalogGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        catalogGuard.Should().Contain("MapGovernanceEnvironmentCatalogSealedManifestConflict");
        registersController.Should().Contain("GetReviewsAwaitingAction");
        registersController.Should().Contain("GetDecisionsNeededSummary");
        registersController.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        attestationController.Should().Contain("GetRealizedValueAttestation");
        attestationController.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1503_1508_coverage_compare_agents_and_export_lineage_verify_blocked_reason_wiring()
    {
        string coverageApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-coverage-api.ts"));
        string coverageBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-coverage-blocked-reason.ts"));
        string coverageHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-scope-coverage-query.ts"));
        string compareApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string compareBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-agent-results-blocked-reason.ts"));
        string compareHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-agent-results-query.ts"));
        string verifyApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-lineage-verify-api.ts"));
        string verifyBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "exports",
                "export-lineage-verify-blocked-reason.ts"));
        string verifyHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-lineage-verify-query.ts"));

        coverageApi.Should().Contain("getGovernanceScopeCoverage");
        coverageApi.Should().Contain("apiGet");
        coverageApi.Should().Contain("governanceScopeCoverageBlockedReason");
        coverageBlocked.Should().Contain("governanceScopeCoverageBlockedReason");
        coverageHook.Should().Contain("governanceScopeCoverageBlockedReason");
        compareApi.Should().Contain("compareAgentResults");
        compareApi.Should().Contain("compareAgentResultsSummary");
        compareApi.Should().Contain("apiGet");
        compareApi.Should().Contain("compareAgentResultsBlockedReason");
        compareBlocked.Should().Contain("compareAgentResultsBlockedReason");
        compareHook.Should().Contain("compareAgentResultsBlockedReason");
        verifyApi.Should().Contain("verifyRunExportLineage");
        verifyApi.Should().Contain("apiGet");
        verifyApi.Should().Contain("exportLineageVerifyBlockedReason");
        verifyBlocked.Should().Contain("exportLineageVerifyBlockedReason");
        verifyHook.Should().Contain("exportLineageVerifyBlockedReason");
    }

    [Fact]
    public void Suggestion1504_1506_setup_resolution_and_environment_catalog_fail_closed_ux()
    {
        string setupStatus = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "setup",
                "_sections",
                "resolve-governance-setup-status.ts"));
        string setupPage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "setup",
                "_sections",
                "GovernanceSetupGuidePageView.tsx"));
        string resolutionPageHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "standards-and-rules",
                "_sections",
                "use-governance-resolution-page.ts"));
        string resolutionPage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "standards-and-rules",
                "_sections",
                "GovernanceResolutionPageView.tsx"));
        string environmentHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-environment-catalog-query.ts"));
        string environmentsClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "governance", "GovernanceEnvironmentsClient.tsx"));
        string readBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));

        setupStatus.Should().Contain("governanceSetupGuideBlockedReason");
        setupStatus.Should().Contain("blockedReason");
        setupPage.Should().Contain("model.blockedReason");
        setupPage.Should().Contain("governance-setup-bundle-load-failure");
        resolutionPageHook.Should().Contain("governanceResolutionBlockedReason");
        resolutionPageHook.Should().Contain("blockedReason");
        resolutionPage.Should().Contain("standards-rules-blocked-reason");
        environmentHook.Should().Contain("governanceEnvironmentCatalogBlockedReason");
        environmentsClient.Should().Contain("catalogQuery.blockedReason");
        environmentsClient.Should().Contain("governance-environment-catalog-load-failure");
        readBlocked.Should().Contain("governanceSetupGuideBlockedReason");
        readBlocked.Should().Contain("governanceResolutionBlockedReason");
        readBlocked.Should().Contain("governanceEnvironmentCatalogBlockedReason");
    }
}
