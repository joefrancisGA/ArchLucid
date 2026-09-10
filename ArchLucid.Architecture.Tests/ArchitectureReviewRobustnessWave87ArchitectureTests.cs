using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-87 architecture create/review robustness suggestions 1029–1040.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave87ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1029_1035_remediation_audit_precommit_forensics_events_governance_and_mute_openapi_409()
    {
        string remediation = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.cs"));
        string remediationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingRemediationAssignmentController.SealedManifestGuard.cs"));
        string auditDownload = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Download.cs"));
        string auditCsv = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Csv.cs"));
        string auditGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.SealedManifestGuard.cs"));
        string preCommit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.cs"));
        string preCommitGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreCommitSimulationController.SealedManifestGuard.cs"));
        string traceForensics = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.cs"));
        string traceForensicsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "InternalArchitectureTraceForensicsController.SealedManifestGuard.cs"));
        string runEvents = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityRunEventsController.cs"));
        string runEventsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityRunEventsController.SealedManifestGuard.cs"));
        string dryRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PolicyPacks.DryRun.cs"));
        string simulate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PolicyPacks.Simulate.cs"));
        string insights = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.Insights.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.SealedManifestGuard.cs"));
        string findingMute = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Findings", "FindingMuteController.cs"));
        string findingMuteGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingMuteController.SealedManifestGuard.cs"));

        remediation.Should().Contain("EnsureFindingRemediationAssignmentSealedManifestAllowedAsync");
        remediationGuard.Should().Contain("MapFindingRemediationAssignmentSealedManifestConflict");
        auditDownload.Should().Contain("EnsureAuditExportSealedManifestAllowedAsync");
        auditCsv.Should().Contain("EnsureAuditExportSealedManifestAllowedAsync");
        auditGuard.Should().Contain("MapAuditExportSealedManifestConflict");
        preCommit.Should().Contain("EnsurePreCommitSimulationSealedManifestAllowedAsync");
        preCommitGuard.Should().Contain("MapPreCommitSimulationSealedManifestConflict");
        traceForensics.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        traceForensicsGuard.Should().Contain("MapTraceForensicsSealedManifestConflict");
        runEvents.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        runEventsGuard.Should().Contain("MapRunEventsSealedManifestConflict");
        dryRun.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        dryRun.Should().Contain("EnsureDryRunRunIdsSealedManifestReadAllowedAsync");
        simulate.Should().Contain("MapGovernanceSealedManifestConflict");
        insights.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
        governanceGuard.Should().Contain("MapGovernanceSealedManifestConflict");
        findingMute.Should().Contain("EnsureFindingMuteRunSealedManifestAllowedAsync");
        findingMuteGuard.Should().Contain("MapFindingMuteSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1036_1038_draft_receipt_artifact_and_retrieval_grounding_blocked_reason_wiring()
    {
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftReceiptApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-draft-decision-receipt.ts"));
        string exportRecordBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "exports",
                "export-record-blocked-reason.ts"));
        string artifactApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-artifact-single.ts"));
        string retrievalBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-retrieval-grounding-blocked-reason.ts"));
        string retrievalApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-retrieval-grounding-json.ts"));

        draftBlocked.Should().Contain("architectureDraftBlockedReason");
        draftReceiptApi.Should().Contain("architectureDraftBlockedReason");
        exportRecordBlocked.Should().Contain("exportRecordBlockedReason");
        artifactApi.Should().Contain("exportRecordBlockedReason");
        retrievalBlocked.Should().Contain("runRetrievalGroundingBlockedReason");
        retrievalApi.Should().Contain("runRetrievalGroundingBlockedReason");
    }

    [Fact]
    public void Suggestion1039_1040_run_export_blob_push_and_remediation_assignment_blocked_reason_wiring()
    {
        string blobPushBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-export-blob-push-mutation-blocked-reason.ts"));
        string blobPushApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-export-blob-push-api.ts"));
        string remediationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-remediation-assignment-blocked-reason.ts"));
        string remediationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-remediation-assignment-api.ts"));

        blobPushBlocked.Should().Contain("runExportBlobPushMutationBlockedReason");
        blobPushApi.Should().Contain("runExportBlobPushMutationBlockedReason");
        remediationBlocked.Should().Contain("findingRemediationAssignmentBlockedReason");
        remediationApi.Should().Contain("findingRemediationAssignmentBlockedReason");
    }
}
