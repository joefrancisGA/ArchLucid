using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-108 architecture create/review robustness suggestions 1281–1292.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave108ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1281_1284_agent_evaluation_provenance_and_resolution_sealed_manifest_mappers()
    {
        string agentEvaluation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.cs"));
        string provenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceController.cs"));
        string provenanceQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceQueryController.cs"));
        string resolution = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceResolutionController.cs"));

        agentEvaluation.Should().Contain("MapRunAgentEvaluationSealedManifestConflict");
        provenance.Should().Contain("MapProvenanceSealedManifestConflict");
        provenanceQuery.Should().Contain("MapProvenanceQuerySealedManifestConflict");
        resolution.Should().Contain("MapGovernanceResolutionSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1285_1287_governance_setup_environment_catalog_and_coverage_ack_sealed_manifest_mappers()
    {
        string setup = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceSetupController.cs"));
        string environmentCatalog = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.cs"));
        string coverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));

        setup.Should().Contain("MapGovernanceSetupSealedManifestConflict");
        environmentCatalog.Should().Contain("MapGovernanceEnvironmentCatalogSealedManifestConflict");
        coverageAck.Should().Contain("MapRunCoverageSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1288_1292_provenance_alias_comparison_history_and_activations_blocked_reason_wiring()
    {
        string authorityProvenanceApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "authority-provenance-query-api.ts"));
        string authorityProvenanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "authority-provenance-alias-blocked-reason.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string provenanceGraphBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "provenance-graph-alias-blocked-reason.ts"));
        string comparisonHistoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-comparison-history-api.ts"));
        string comparisonHistoryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "run-comparison-history-blocked-reason.ts"));
        string activationsApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-workflow-api-environments.ts"));
        string activationsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));

        authorityProvenanceApi.Should().Contain("authorityProvenanceAliasBlockedReason");
        authorityProvenanceBlocked.Should().Contain("authorityProvenanceAliasBlockedReason");
        graphApi.Should().Contain("provenanceGraphAliasBlockedReason");
        provenanceGraphBlocked.Should().Contain("provenanceGraphAliasBlockedReason");
        comparisonHistoryApi.Should().Contain("runComparisonHistoryBlockedReason");
        comparisonHistoryBlocked.Should().Contain("runComparisonHistoryBlockedReason");
        activationsApi.Should().Contain("governanceActivationsBlockedReason");
        activationsBlocked.Should().Contain("governanceActivationsBlockedReason");
    }
}
