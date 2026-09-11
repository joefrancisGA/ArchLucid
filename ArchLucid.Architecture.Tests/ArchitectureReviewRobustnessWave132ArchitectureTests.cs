using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-132 architecture create/review robustness suggestions 1569–1580.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave132ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1569_1574_disposition_coverage_exceptions_and_policy_assign_runtime_409_mappers()
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
        dispositions.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        runCoverageAck.Should().Contain("PutAcknowledgedCoverage");
        runCoverageAck.Should().Contain("PatchRunCoveragePack");
        runCoverageAck.Should().Contain("MapRunCoverageSealedManifestConflict");
        runCoverageAck.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        exceptions.Should().Contain("RevokeRiskException");
        exceptions.Should().Contain("RenewRiskException");
        exceptions.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        policyAssign.Should().Contain("Assign");
        policyAssign.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyMapper.Should().Contain("MapAssign");
        policyMapper.Should().Contain("PolicyPackHttpOutcome.Conflict");
    }

    [Fact]
    public void Suggestion1575_1577_governance_workflow_ask_coverage_and_remediation_ui_wiring()
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

        workflowHook.Should().Contain("governanceWorkflowRunReadBlockedReason");
        workflowCallout.Should().Contain("governance-workflow-run-lists-blocked");
        workflowShell.Should().Contain("GovernanceWorkflowRunListsBlockedCallout");
        remediationHook.Should().Contain("findingRemediationAssignmentBlockedReason");
        remediationBlocked.Should().Contain("findingRemediationAssignmentBlockedReason");
        askHook.Should().Contain("askRunCoverageHonestyBlockedReason");
        askStrip.Should().Contain("ask-run-coverage-honesty-blocked");
    }

    [Fact]
    public void Suggestion1578_1580_package_print_quiet_engines_bulk_and_merge_conflict_ui_wiring()
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
        string bulkActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "usability", "GovernanceFindingsBulkActions.tsx"));
        string mergePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "FindingMergeConflictResolvePanel.tsx"));

        meetingCaptureHook.Should().Contain("packagePrintMeetingCaptureBlockedReason");
        packagePrintClient.Should().Contain("meetingCaptureBlockedReason");
        packagePrintView.Should().Contain("packagePrintMeetingCaptureBlockedSection");
        packagePrintView.Should().Contain("package-print-meeting-capture-blocked");
        quietEnginesHint.Should().Contain("governance-findings-queue-quiet-engines-blocked");
        bulkActions.Should().Contain("findingBulkDispositionBlockedReason");
        mergePanel.Should().Contain("findingMergeConflictBlockedReason");
    }
}
