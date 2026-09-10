using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-86 architecture create/review robustness suggestions 1017–1028.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave86ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1017_1018_governance_stickiness_exceptions_and_schedules_openapi_409()
    {
        string exceptions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Exceptions.cs"));
        string schedules = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Schedules.cs"));
        string stickinessGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.SealedManifestGuard.cs"));

        exceptions.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        schedules.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        stickinessGuard.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1019_1023_graph_run_query_explanation_coverage_and_agent_evaluation_openapi_409()
    {
        string reviewGraph = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.ReviewGraph.cs"));
        string snapshot = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.Snapshot.cs"));
        string graphGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.SealedManifestGuard.cs"));
        string provenance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Provenance.cs"));
        string findings = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Findings.cs"));
        string detail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Detail.cs"));
        string runQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.SealedManifestGuard.cs"));
        string runExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.RunExplain.cs"));
        string findingExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.FindingExplain.cs"));
        string holistic = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));
        string explanationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.SealedManifestGuard.cs"));
        string runCoverage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.cs"));
        string runCoverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));
        string runCoverageGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.SealedManifestGuard.cs"));
        string agentEvaluation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.cs"));
        string agentEvaluationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunAgentEvaluationController.SealedManifestGuard.cs"));

        reviewGraph.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        snapshot.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        graphGuard.Should().Contain("MapGraphSealedManifestConflict");
        provenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        findings.Should().Contain("MapProductRunQuerySealedManifestConflict");
        detail.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runQueryGuard.Should().Contain("MapProductRunQuerySealedManifestConflict");
        runExplain.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        findingExplain.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        holistic.Should().Contain("EnsureCompareRunsSealedManifestReadAllowedAsync");
        explanationGuard.Should().Contain("MapExplanationSealedManifestConflict");
        runCoverage.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runCoverageAck.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runCoverageGuard.Should().Contain("MapRunCoverageSealedManifestConflict");
        agentEvaluation.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        agentEvaluationGuard.Should().Contain("MapRunAgentEvaluationSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1024_1028_architecture_docx_run_package_decision_receipt_request_json_and_compare_blocked_reason_wiring()
    {
        string architecturePackageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-package-docx-mutation-blocked-reason.ts"));
        string architecturePackageApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-architecture-package-docx.ts"));
        string runPackageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-package-export-mutation-blocked-reason.ts"));
        string runPackageApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-run-package.ts"));
        string decisionReceiptBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "decision-receipt-mutation-blocked-reason.ts"));
        string decisionReceiptApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-decision-receipt.ts"));
        string requestJsonBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-json-mutation-blocked-reason.ts"));
        string requestJsonApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-architecture-request.ts"));
        string compareBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-docx-mutation-blocked-reason.ts"));
        string compareApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-end-to-end-compare-export.ts"));

        architecturePackageBlocked.Should().Contain("architecturePackageDocxMutationBlockedReason");
        architecturePackageApi.Should().Contain("architecturePackageDocxMutationBlockedReason");
        runPackageBlocked.Should().Contain("runPackageExportMutationBlockedReason");
        runPackageApi.Should().Contain("runPackageExportMutationBlockedReason");
        decisionReceiptBlocked.Should().Contain("decisionReceiptMutationBlockedReason");
        decisionReceiptApi.Should().Contain("decisionReceiptMutationBlockedReason");
        requestJsonBlocked.Should().Contain("architectureRequestJsonMutationBlockedReason");
        requestJsonApi.Should().Contain("architectureRequestJsonMutationBlockedReason");
        compareBlocked.Should().Contain("comparisonDocxMutationBlockedReason");
        compareApi.Should().Contain("comparisonDocxMutationBlockedReason");
    }
}
