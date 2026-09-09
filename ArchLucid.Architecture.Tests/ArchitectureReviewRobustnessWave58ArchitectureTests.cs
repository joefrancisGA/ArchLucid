using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-58 architecture create/review robustness suggestions 681–692.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave58ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion681_683_setup_resolution_and_environment_catalog_openapi_409()
    {
        string setupController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceSetupController.cs"));
        string setupGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceSetupController.SealedManifestGuard.cs"));
        string resolutionController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceResolutionController.cs"));
        string resolutionGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceResolutionController.SealedManifestGuard.cs"));
        string catalogController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceEnvironmentCatalogController.cs"));
        string catalogGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceEnvironmentCatalogController.SealedManifestGuard.cs"));

        setupController.Should().Contain("GetSetupGuideBundle");
        setupController.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        setupController.Should().Contain("Status409Conflict");
        setupGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        resolutionController.Should().Contain("Resolve");
        resolutionController.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        resolutionController.Should().Contain("Status409Conflict");
        resolutionGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        catalogController.Should().Contain("Get");
        catalogController.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        catalogController.Should().Contain("Status409Conflict");
        catalogGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion684_686_reviews_decisions_and_attestation_openapi_409()
    {
        string registersController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Registers.cs"));
        string attestationController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceStickinessController.Attestation.cs"));
        string facade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.cs"));
        string recurrenceFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Recurrence.cs"));

        registersController.Should().Contain("GetReviewsAwaitingAction");
        registersController.Should().Contain("GetDecisionsNeededSummary");
        registersController.Should().Contain("Status409Conflict");
        attestationController.Should().Contain("GetRealizedValueAttestation");
        attestationController.Should().Contain("Status409Conflict");
        facade.Should().Contain("GetReviewsAwaitingActionAsync");
        facade.Should().Contain("GetDecisionsNeededSummaryAsync");
        facade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
        recurrenceFacade.Should().Contain("GetRealizedValueAttestationAsync");
        recurrenceFacade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
    }

    [Fact]
    public void Suggestion687_690_coverage_and_governance_read_fail_closed_clients()
    {
        string coverageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-coverage-api.ts"));
        string coverageHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-scope-coverage-query.ts"));
        string coverageBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-coverage-blocked-reason.ts"));
        string setupStatus = File.ReadAllText(
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
        string resolutionPage = File.ReadAllText(
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
        string environmentHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-environment-catalog-query.ts"));
        string readBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-workflow-read-blocked-reason.ts"));

        coverageApi.Should().Contain("getGovernanceScopeCoverage");
        coverageApi.Should().Contain("apiGetSealedManifestAware");
        coverageHook.Should().Contain("governanceScopeCoverageBlockedReason");
        coverageBlocked.Should().Contain("governanceScopeCoverageBlockedReason");
        setupStatus.Should().Contain("governanceSetupGuideBlockedReason");
        setupStatus.Should().Contain("blockedReason");
        resolutionPage.Should().Contain("governanceResolutionBlockedReason");
        resolutionPage.Should().Contain("blockedReason");
        environmentHook.Should().Contain("governanceEnvironmentCatalogBlockedReason");
        readBlocked.Should().Contain("governanceSetupGuideBlockedReason");
        readBlocked.Should().Contain("governanceResolutionBlockedReason");
        readBlocked.Should().Contain("governanceEnvironmentCatalogBlockedReason");
    }

    [Fact]
    public void Suggestion691_692_compare_agents_and_export_lineage_verify_clients()
    {
        string compareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string compareHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-compare-agent-results-query.ts"));
        string compareBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "compare", "compare-agent-results-blocked-reason.ts"));
        string verifyApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-lineage-verify-api.ts"));
        string verifyHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-export-lineage-verify-query.ts"));
        string verifyBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "export-lineage-verify-blocked-reason.ts"));
        string queryKeys = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "query", "operator-query-keys.ts"));

        compareApi.Should().Contain("compareAgentResults");
        compareApi.Should().Contain("compareAgentResultsSummary");
        compareApi.Should().Contain("apiGetSealedManifestAware");
        compareHook.Should().Contain("compareAgentResultsBlockedReason");
        compareBlocked.Should().Contain("compareAgentResultsBlockedReason");
        verifyApi.Should().Contain("verifyRunExportLineage");
        verifyApi.Should().Contain("apiGetSealedManifestAware");
        verifyHook.Should().Contain("exportLineageVerifyBlockedReason");
        verifyBlocked.Should().Contain("exportLineageVerifyBlockedReason");
        queryKeys.Should().Contain("compareAgentResults");
        queryKeys.Should().Contain("exportLineageVerify");
    }
}
