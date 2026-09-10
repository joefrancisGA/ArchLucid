using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-89 architecture create/review robustness suggestions 1053–1064.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave89ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1053_1059_runs_export_architecture_export_governance_coverage_posture_preview_retrieval_and_feedback_openapi_409()
    {
        string runsExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsExportController.SealedManifestGuard.cs"));
        string architectureExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArchitectureExportController.SealedManifestGuard.cs"));
        string coverageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceCoverageController.SealedManifestGuard.cs"));
        string postureGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePostureController.SealedManifestGuard.cs"));
        string previewGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreviewController.SealedManifestGuard.cs"));
        string retrievalGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "RetrievalController.SealedManifestGuard.cs"));
        string feedbackGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "FindingFeedbackController.SealedManifestGuard.cs"));

        runsExportGuard.Should().Contain("MapRunsExportSealedManifestConflict");
        architectureExportGuard.Should().Contain("MapArchitectureExportSealedManifestConflict");
        coverageGuard.Should().Contain("MapGovernanceCoverageSealedManifestConflict");
        postureGuard.Should().Contain("MapGovernancePostureSealedManifestConflict");
        previewGuard.Should().Contain("MapGovernancePreviewSealedManifestConflict");
        retrievalGuard.Should().Contain("MapRetrievalSealedManifestConflict");
        feedbackGuard.Should().Contain("MapFindingFeedbackSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1060_1062_governance_coverage_posture_and_finding_feedback_blocked_reason_wiring()
    {
        string coverageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-coverage-blocked-reason.ts"));
        string coverageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-coverage-api.ts"));
        string postureBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-posture-blocked-reason.ts"));
        string postureApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-registers.ts"));
        string feedbackBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-feedback-mutation-blocked-reason.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));

        coverageBlocked.Should().Contain("governanceScopeCoverageBlockedReason");
        coverageApi.Should().Contain("governanceScopeCoverageBlockedReason");
        postureBlocked.Should().Contain("governancePostureBlockedReason");
        postureApi.Should().Contain("governancePostureBlockedReason");
        feedbackBlocked.Should().Contain("findingFeedbackMutationBlockedReason");
        findingsApi.Should().Contain("findingFeedbackMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1063_1064_run_provenance_and_retrieval_search_blocked_reason_wiring()
    {
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "provenance",
                "run-provenance-blocked-reason.ts"));
        string provenanceApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "architecture-runs-read-detail-artifacts.ts"));
        string askBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "ask", "ask-blocked-reason.ts"));
        string retrievalApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "retrieval-search-api.ts"));

        provenanceBlocked.Should().Contain("runProvenanceBlockedReason");
        provenanceApi.Should().Contain("runProvenanceBlockedReason");
        askBlocked.Should().Contain("askBlockedReason");
        retrievalApi.Should().Contain("askBlockedReason");
    }
}
