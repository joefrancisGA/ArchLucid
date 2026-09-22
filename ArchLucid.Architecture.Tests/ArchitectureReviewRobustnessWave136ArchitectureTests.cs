using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-136 architecture create/review robustness suggestions 1617–1628.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave136ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1617_1622_draft_submit_governance_policy_and_run_mutation_runtime_409_mappers()
    {
        string draftSubmit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AdmitSubmit.cs"));
        string approvalReview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Review.cs"));
        string policyAssignment = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string policyFacadeCrud = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PolicyPacks",
                "PolicyPackHttpFacade.Crud.cs"));
        string runDisposition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));
        string replayRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.CommitReplayPin.Replay.cs"));
        string authorityGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.SealedManifestGuard.cs"));

        draftSubmit.Should().Contain("SubmitDraft");
        draftSubmit.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftSubmit.Should().Contain("MapDraftRequestSealedManifestConflict");
        approvalReview.Should().Contain("Approve");
        approvalReview.Should().Contain("Reject");
        approvalReview.Should().Contain("EnsureSealedManifestReadAllowedForApprovalRequestAsync");
        approvalReview.Should().Contain("MapGovernanceSealedManifestConflict");
        policyAssignment.Should().Contain("Assign");
        policyAssignment.Should().Contain("ArchiveAssignment");
        policyAssignment.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyFacadeCrud.Should().Contain("AssignAsync");
        policyFacadeCrud.Should().Contain("ArchiveAssignmentAsync");
        policyFacadeCrud.Should().Contain("EnsureMutationSealedManifestOrThrowAsync");
        runDisposition.Should().Contain("RecordRunOperatorGovernanceDisposition");
        runDisposition.Should().Contain("MapRunQuerySealedManifestConflict");
        replayRun.Should().Contain("ReplayRun");
        replayRun.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        replayRun.Should().Contain("MapRunsSealedManifestConflict");
        authorityGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion1623_1625_export_blob_push_and_policy_pack_mutation_ui_wiring()
    {
        string blobPushApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-export-blob-push-api.ts"));
        string blobPushBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-export-blob-push-mutation-blocked-reason.ts"));
        string blobPushHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-export-blob-push-mutation.ts"));
        string blobPushPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "runs",
                "RunDetailExportBlobPushPanel.tsx"));
        string exportsSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailArtifactsExportsSection.tsx"));
        string assignBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-assign-mutation-blocked-reason.ts"));
        string createPublish = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "policy-packs",
                "_sections",
                "use-policy-packs-create-publish.ts"));
        string archiveBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-archive-mutation-blocked-reason.ts"));
        string assignApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));
        string workspaceSelection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "policy-packs",
                "_sections",
                "use-policy-packs-workspace-selection.ts"));

        blobPushApi.Should().Contain("runExportBlobPushMutationBlockedReason");
        blobPushBlocked.Should().Contain("runExportBlobPushMutationBlockedReason");
        blobPushHook.Should().Contain("runExportBlobPushMutationBlockedReason");
        blobPushPanel.Should().Contain("useRunExportBlobPushMutation");
        exportsSection.Should().Contain("RunDetailExportBlobPushPanel");
        assignBlocked.Should().Contain("policyPackAssignMutationBlockedReason");
        createPublish.Should().Contain("policyPackAssignMutationBlockedReason");
        archiveBlocked.Should().Contain("policyPackArchiveMutationBlockedReason");
        assignApi.Should().Contain("archivePolicyPackAssignment");
        workspaceSelection.Should().Contain("policyPackArchiveMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1626_1628_identity_disposition_and_what_if_mutation_ui_wiring()
    {
        string identityMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-identity-mutation-blocked-reason.ts"));
        string renameForm = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityRenameForm.tsx"));
        string archiveControl = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityArchiveControl.tsx"));
        string dispositionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-operator-governance-disposition-mutation-blocked-reason.ts"));
        string dispositionActions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "runs",
                "RunDetailRunGovernanceDispositionActions.tsx"));
        string whatIfExecute = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-package-what-if-execute.ts"));
        string whatIfPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "reviews",
                "ReviewPackageWhatIfExecutePanel.tsx"));

        identityMutationBlocked.Should().Contain("architectureIdentityMutationBlockedReason");
        renameForm.Should().Contain("architectureIdentityMutationBlockedReason");
        archiveControl.Should().Contain("architectureIdentityMutationBlockedReason");
        dispositionBlocked.Should().Contain("runOperatorGovernanceDispositionMutationBlockedReason");
        dispositionActions.Should().Contain("runOperatorGovernanceDispositionMutationBlockedReason");
        whatIfExecute.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        whatIfPanel.Should().Contain("review-package-what-if-execute-blocked-reason");
    }
}
