using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-90 architecture create/review robustness suggestions 1065–1076.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave90ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1065_1071_comparison_provenance_run_comparison_and_governance_openapi_409()
    {
        string comparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonController.SealedManifestGuard.cs"));
        string provenanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ProvenanceController.SealedManifestGuard.cs"));
        string provenanceQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ProvenanceQueryController.SealedManifestGuard.cs"));
        string runComparisonGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.SealedManifestGuard.cs"));
        string resolutionGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceResolutionController.SealedManifestGuard.cs"));
        string setupGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceSetupController.SealedManifestGuard.cs"));
        string environmentCatalogGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.SealedManifestGuard.cs"));

        comparisonGuard.Should().Contain("MapComparisonSealedManifestConflict");
        provenanceGuard.Should().Contain("MapProvenanceSealedManifestConflict");
        provenanceQueryGuard.Should().Contain("MapProvenanceQuerySealedManifestConflict");
        runComparisonGuard.Should().Contain("MapRunComparisonSealedManifestConflict");
        resolutionGuard.Should().Contain("MapGovernanceResolutionSealedManifestConflict");
        setupGuard.Should().Contain("MapGovernanceSetupSealedManifestConflict");
        environmentCatalogGuard.Should().Contain("MapGovernanceEnvironmentCatalogSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1072_1073_comparison_search_and_record_blocked_reason_wiring()
    {
        string searchBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-search-blocked-reason.ts"));
        string recordBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-record-blocked-reason.ts"));
        string comparisonApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));

        searchBlocked.Should().Contain("comparisonSearchBlockedReason");
        recordBlocked.Should().Contain("comparisonRecordBlockedReason");
        comparisonApi.Should().Contain("comparisonSearchBlockedReason");
        comparisonApi.Should().Contain("comparisonRecordBlockedReason");
    }

    [Fact]
    public void Suggestion1074_1076_provenance_graph_authority_provenance_and_environment_catalog_blocked_reason_wiring()
    {
        string provenanceGraphBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "provenance-graph-alias-blocked-reason.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string authorityProvenanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "authority-provenance-alias-blocked-reason.ts"));
        string authorityProvenanceApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "authority-provenance-query-api.ts"));
        string environmentCatalogBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));
        string environmentCatalogApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-workflow-api-environments.ts"));

        provenanceGraphBlocked.Should().Contain("provenanceGraphAliasBlockedReason");
        graphApi.Should().Contain("provenanceGraphAliasBlockedReason");
        authorityProvenanceBlocked.Should().Contain("authorityProvenanceAliasBlockedReason");
        authorityProvenanceApi.Should().Contain("authorityProvenanceAliasBlockedReason");
        environmentCatalogBlocked.Should().Contain("governanceEnvironmentCatalogBlockedReason");
        environmentCatalogApi.Should().Contain("governanceEnvironmentCatalogBlockedReason");
    }
}
