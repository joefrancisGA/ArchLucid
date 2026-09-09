using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-69 architecture create/review robustness suggestions 813–824.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave69ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion813_818_run_execute_finalize_ledger_clarification_request_governance_openapi_409()
    {
        string executeRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Execute.cs"));
        string asyncOperations = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.AsyncOperations.cs"));
        string commitRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.CommitReplayPin.Commit.cs"));
        string technologyLedger = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "TechnologyLedgerController.cs"));
        string clarificationQuestions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.cs"));
        string architectureRequests = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.ArchitectureRequests.cs"));
        string governanceCatalog = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.SealedManifestGuard.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceEnvironmentCatalogController.SealedManifestGuard.cs"));

        executeRun.Should().Contain("ExecuteRun");
        executeRun.Should().Contain("ExecuteRunSelective");
        executeRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        executeRun.Should().Contain("Status409Conflict");
        asyncOperations.Should().Contain("ExecuteRunAsync");
        asyncOperations.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        asyncOperations.Should().Contain("Status409Conflict");
        commitRun.Should().Contain("CommitRun");
        commitRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        commitRun.Should().Contain("Status409Conflict");
        technologyLedger.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        technologyLedger.Should().Contain("Status409Conflict");
        technologyLedger.Should().Contain("ConflictException");
        clarificationQuestions.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        clarificationQuestions.Should().Contain("Status409Conflict");
        clarificationQuestions.Should().Contain("ConflictException");
        architectureRequests.Should().Contain("CloneRequest");
        architectureRequests.Should().Contain("ArchiveRequest");
        architectureRequests.Should().Contain("DeleteRequest");
        architectureRequests.Should().Contain("RestoreRequest");
        architectureRequests.Should().Contain("EnsureArchitectureRequestSealedManifestReadAllowedAsync");
        architectureRequests.Should().Contain("Status409Conflict");
        governanceCatalog.Should().Contain("Replace");
        governanceCatalog.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
        governanceCatalog.Should().Contain("Status409Conflict");
        runsGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        runsGuard.Should().Contain("EnsureArchitectureRequestSealedManifestReadAllowedAsync");
        governanceGuard.Should().Contain("EnsureGovernanceScopeSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion819_821_review_execute_selective_and_risk_exception_mutation_blocked_reason_ui_wiring()
    {
        string reviewExecuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-execute-mutation-blocked-reason.ts"));
        string reRunReviewButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "ReRunReviewButton.tsx"));
        string selectiveExecuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-selective-execute-mutation-blocked-reason.ts"));
        string agentResultsSummary = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "runs",
                "RunAgentResultsSummaryCard.tsx"));
        string riskExceptionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));
        string findingInspectWaivers = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "findings",
                "[findingId]",
                "use-finding-inspect-governance-stickiness-waivers.ts"));

        reviewExecuteBlocked.Should().Contain("reviewExecuteMutationBlockedReason");
        reRunReviewButton.Should().Contain("reviewExecuteMutationBlockedReason");
        selectiveExecuteBlocked.Should().Contain("reviewSelectiveExecuteMutationBlockedReason");
        agentResultsSummary.Should().Contain("reviewSelectiveExecuteMutationBlockedReason");
        riskExceptionBlocked.Should().Contain("riskExceptionMutationBlockedReason");
        findingInspectWaivers.Should().Contain("riskExceptionMutationBlockedReason");
    }

    [Fact]
    public void Suggestion822_824_ledger_clarification_and_governance_catalog_mutation_blocked_reason_ui_wiring()
    {
        string technologyLedgerBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "technology-ledger-mutation-blocked-reason.ts"));
        string technologyBaselinePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "reviews",
                "technology-baseline",
                "TechnologyBaselinePanel.tsx"));
        string clarificationAnswersBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "clarification-answers-mutation-blocked-reason.ts"));
        string clarificationAnswerCapture = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ClarificationAnswerCapturePanel.tsx"));
        string governanceCatalogBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-environment-catalog-mutation-blocked-reason.ts"));
        string governanceEnvironmentsClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceEnvironmentsClient.tsx"));

        technologyLedgerBlocked.Should().Contain("technologyLedgerMutationBlockedReason");
        technologyBaselinePanel.Should().Contain("technologyLedgerMutationBlockedReason");
        clarificationAnswersBlocked.Should().Contain("clarificationAnswersMutationBlockedReason");
        clarificationAnswerCapture.Should().Contain("clarificationAnswersMutationBlockedReason");
        governanceCatalogBlocked.Should().Contain("governanceEnvironmentCatalogMutationBlockedReason");
        governanceEnvironmentsClient.Should().Contain("governanceEnvironmentCatalogMutationBlockedReason");
    }
}
