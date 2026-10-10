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
        string agentEvaluation = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.cs"));
        string provenance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceController.cs"));
        string provenanceQuery = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ProvenanceQueryController.cs"));
        string resolution = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string setup = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceSetupController.cs"));
        string environmentCatalog = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.cs"));
        string coverageAck = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string authorityProvenanceApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "authority-provenance-query-api.ts"));
        string authorityProvenanceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "authority-provenance-alias-blocked-reason.ts"));
        string graphApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string provenanceGraphBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "provenance-graph-alias-blocked-reason.ts"));
        string comparisonHistoryApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-comparison-history-api.ts"));
        string comparisonHistoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "run-comparison-history-blocked-reason.ts"));
        string activationsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-workflow-api-environments.ts"));
        string activationsBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
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
