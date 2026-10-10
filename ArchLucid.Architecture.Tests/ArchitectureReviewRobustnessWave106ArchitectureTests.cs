using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-106 architecture create/review robustness suggestions 1257–1268.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave106ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1257_1258_graph_review_and_temporal_snapshot_sealed_manifest_mappers()
    {
        string reviewGraph = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.ReviewGraph.cs"));
        string snapshot = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.Snapshot.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.SealedManifestGuard.cs"));

        reviewGraph.Should().Contain("MapGraphSealedManifestConflict");
        snapshot.Should().Contain("MapGraphSealedManifestConflict");
        guard.Should().Contain("MapGraphSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1259_1263_run_query_explanation_and_coverage_sealed_manifest_mappers()
    {
        string runDetail = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Detail.cs"));
        string provenance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Provenance.cs"));
        string runExplain = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.RunExplain.cs"));
        string findingExplain = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.FindingExplain.cs"));
        string runCoverage = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.cs"));

        runDetail.Should().Contain("MapProductRunQuerySealedManifestConflict");
        provenance.Should().Contain("MapProductRunQuerySealedManifestConflict");
        runExplain.Should().Contain("MapExplanationSealedManifestConflict");
        findingExplain.Should().Contain("MapExplanationSealedManifestConflict");
        runCoverage.Should().Contain("MapRunCoverageSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1264_1268_advisory_clarification_attestation_disposition_and_archive_blocked_reason_wiring()
    {
        string advisoryApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory-api.ts"));
        string advisoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "advisory",
                "advisory-recommendation-apply-mutation-blocked-reason.ts"));
        string clarificationApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "knowledge-model-clarification-api.ts"));
        string clarificationBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "clarification-answers-mutation-blocked-reason.ts"));
        string attestationApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-exceptions-schedules.ts"));
        string attestationBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "realized-value-attestation-mutation-blocked-reason.ts"));
        string dispositionApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string dispositionBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-operator-governance-disposition-mutation-blocked-reason.ts"));
        string archiveApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));
        string archiveBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-archive-mutation-blocked-reason.ts"));

        advisoryApi.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        advisoryBlocked.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        clarificationApi.Should().Contain("clarificationAnswersMutationBlockedReason");
        clarificationBlocked.Should().Contain("clarificationAnswersMutationBlockedReason");
        attestationApi.Should().Contain("realizedValueAttestationMutationBlockedReason");
        attestationBlocked.Should().Contain("realizedValueAttestationMutationBlockedReason");
        dispositionApi.Should().Contain("runOperatorGovernanceDispositionMutationBlockedReason");
        dispositionBlocked.Should().Contain("runOperatorGovernanceDispositionMutationBlockedReason");
        archiveApi.Should().Contain("policyPackArchiveMutationBlockedReason");
        archiveBlocked.Should().Contain("policyPackArchiveMutationBlockedReason");
    }
}
