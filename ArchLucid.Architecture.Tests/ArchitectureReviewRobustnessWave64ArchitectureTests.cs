using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-64 architecture create/review robustness suggestions 753–764.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave64ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion753_758_disposition_coverage_exceptions_and_policy_assign_openapi_409()
    {
        string dispositions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Dispositions.cs"));
        string runCoverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));
        string exceptions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Exceptions.cs"));
        string policyAssign = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string policyMapper = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Http", "Governance", "PolicyPackHttpResultMapper.cs"));

        dispositions.Should().Contain("RecordDisposition");
        dispositions.Should().Contain("RecordBulkDisposition");
        dispositions.Should().Contain("ResolveFindingMergeConflict");
        dispositions.Should().Contain("Status409Conflict");
        dispositions.Should().Contain("ConflictException");
        runCoverageAck.Should().Contain("PutAcknowledgedCoverage");
        runCoverageAck.Should().Contain("PatchRunCoveragePack");
        runCoverageAck.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runCoverageAck.Should().Contain("Status409Conflict");
        exceptions.Should().Contain("RevokeRiskException");
        exceptions.Should().Contain("RenewRiskException");
        exceptions.Should().Contain("Status409Conflict");
        exceptions.Should().Contain("ConflictException");
        policyAssign.Should().Contain("Assign");
        policyAssign.Should().Contain("Status409Conflict");
        policyMapper.Should().Contain("MapAssign");
        policyMapper.Should().Contain("PolicyPackHttpOutcome.Conflict");
    }

    [Fact]
    public void Suggestion759_761_governance_workflow_ask_coverage_and_remediation_ui_wiring()
    {
        string workflowHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-workflow-run-lists-query.ts"));
        string workflowCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceWorkflowRunListsBlockedCallout.tsx"));
        string workflowShell = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "GovernanceWorkflowPageShell.tsx"));
        string workflowMutations = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "use-governance-workflow-page-mutations.ts"));
        string remediationHook = File.ReadAllText(
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
                "use-finding-inspect-governance-stickiness-remediation.ts"));
        string remediationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-remediation-assignment-blocked-reason.ts"));
        string askHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-ask-run-coverage-honesty-query.ts"));
        string askStrip = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ask", "AskRunCoverageHonestyStrip.tsx"));
        string askBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "ask", "ask-run-coverage-honesty-blocked-reason.ts"));

        workflowHook.Should().Contain("governanceWorkflowRunReadBlockedReason");
        workflowCallout.Should().Contain("governance-workflow-run-lists-blocked");
        workflowShell.Should().Contain("GovernanceWorkflowRunListsBlockedCallout");
        workflowMutations.Should().Contain("runListsBlockedReason");
        remediationHook.Should().Contain("findingRemediationAssignmentBlockedReason");
        remediationBlocked.Should().Contain("findingRemediationAssignmentBlockedReason");
        askHook.Should().Contain("askRunCoverageHonestyBlockedReason");
        askStrip.Should().Contain("ask-run-coverage-honesty-blocked");
        askBlocked.Should().Contain("askRunCoverageHonestyBlockedReason");
    }

    [Fact]
    public void Suggestion762_764_package_print_quiet_engines_bulk_and_merge_conflict_ui_wiring()
    {
        string meetingCaptureHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-package-print-meeting-capture-query.ts"));
        string packagePrintClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintPageClient.tsx"));
        string packagePrintView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintPageView.tsx"));
        string meetingCaptureBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "reviews",
                "package-print-meeting-capture-blocked-reason.ts"));
        string quietEnginesHint = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "findings",
                "GovernanceFindingsQueueQuietEnginesHint.tsx"));
        string quietEnginesBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-findings-queue-quiet-engines-blocked-reason.ts"));
        string bulkActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "usability", "GovernanceFindingsBulkActions.tsx"));
        string bulkBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "finding-bulk-disposition-blocked-reason.ts"));
        string mergePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "FindingMergeConflictResolvePanel.tsx"));
        string mergeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-merge-conflict-blocked-reason.ts"));

        meetingCaptureHook.Should().Contain("packagePrintMeetingCaptureBlockedReason");
        packagePrintClient.Should().Contain("meetingCaptureBlockedReason");
        packagePrintView.Should().Contain("package-print-meeting-capture-blocked");
        meetingCaptureBlocked.Should().Contain("packagePrintMeetingCaptureBlockedReason");
        quietEnginesHint.Should().Contain("governance-findings-queue-quiet-engines-blocked");
        quietEnginesHint.Should().Contain("governanceFindingsQueueQuietEnginesBlockedReason");
        quietEnginesBlocked.Should().Contain("governanceFindingsQueueQuietEnginesBlockedReason");
        bulkActions.Should().Contain("findingBulkDispositionBlockedReason");
        bulkBlocked.Should().Contain("findingBulkDispositionBlockedReason");
        mergePanel.Should().Contain("findingMergeConflictBlockedReason");
        mergeBlocked.Should().Contain("findingMergeConflictBlockedReason");
    }
}
