using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-134 architecture create/review robustness suggestions 1593–1604.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave134ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1593_1598_policy_pack_and_draft_mutation_runtime_409_mappers()
    {
        string policyCrud = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Crud.cs"));
        string policyAssignment = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string policyMutationGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PolicyPacks",
                "PolicyPackHttpFacade.MutationSealedManifestGuard.cs"));
        string draftQuestions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Questions.cs"));
        string draftAdmit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AdmitSubmit.cs"));
        string draftBranch = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.Branch.cs"));
        string draftAbandonReopen = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AbandonReopen.cs"));
        string draftCloneSnapshot = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.CloneSnapshot.cs"));

        policyCrud.Should().Contain("Create");
        policyCrud.Should().Contain("Publish");
        policyCrud.Should().Contain("DeletePack");
        policyCrud.Should().Contain("DuplicatePack");
        policyCrud.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyAssignment.Should().Contain("SetAssignmentEnabled");
        policyAssignment.Should().Contain("SetAssignmentOrganizationRequired");
        policyAssignment.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyMutationGuard.Should().Contain("EnsureMutationSealedManifestOrThrowAsync");
        policyMutationGuard.Should().Contain("GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync");
        draftQuestions.Should().Contain("AnswerQuestion");
        draftQuestions.Should().Contain("SkipQuestion");
        draftQuestions.Should().Contain("ReasonDraft");
        draftQuestions.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftQuestions.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftAdmit.Should().Contain("AdmitDraft");
        draftAdmit.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftAdmit.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftBranch.Should().Contain("BranchDraft");
        draftBranch.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftBranch.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftAbandonReopen.Should().Contain("AbandonDraft");
        draftAbandonReopen.Should().Contain("ReopenDraft");
        draftAbandonReopen.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftCloneSnapshot.Should().Contain("CloneDraftSnapshot");
        draftCloneSnapshot.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion1599_1601_policy_draft_and_risk_exception_ui_wiring()
    {
        string policyMutationBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-mutation-blocked-reason.ts"));
        string policyCreatePublish = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string policyWorkspaceSelection = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string draftBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftAdmitHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "new",
                "use-guided-intake-draft-admit.ts"));
        string draftSubmitHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "new",
                "use-guided-intake-draft-submit.ts"));
        string presenterElicitation = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-presenter-elicitation.ts"));
        string riskExceptionClient = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "use-risk-exceptions-client.ts"));
        string riskExceptionBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));

        policyMutationBlocked.Should().Contain("policyPackMutationBlockedReason");
        policyCreatePublish.Should().Contain("policyPackMutationBlockedReason");
        policyWorkspaceSelection.Should().Contain("policyPackMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftAdmitHook.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftSubmitHook.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        presenterElicitation.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        riskExceptionClient.Should().Contain("riskExceptionMutationBlockedReason");
        riskExceptionBlocked.Should().Contain("riskExceptionMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1602_1604_feedback_advisory_and_finalize_ui_wiring()
    {
        string findingFeedback = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "FindingFeedbackThumbs.tsx"));
        string findingFeedbackBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-feedback-mutation-blocked-reason.ts"));
        string advisoryScans = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "advisory",
                "use-advisory-scans-content.ts"));
        string advisoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "advisory",
                "advisory-recommendation-apply-mutation-blocked-reason.ts"));
        string commitRunButton = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CommitRunButton.tsx"));
        string finalizeBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-finalize-mutation-blocked-reason.ts"));

        findingFeedback.Should().Contain("findingFeedbackMutationBlockedReason");
        findingFeedbackBlocked.Should().Contain("findingFeedbackMutationBlockedReason");
        advisoryScans.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        advisoryBlocked.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        commitRunButton.Should().Contain("reviewFinalizeMutationBlockedReason");
        finalizeBlocked.Should().Contain("reviewFinalizeMutationBlockedReason");
    }
}
