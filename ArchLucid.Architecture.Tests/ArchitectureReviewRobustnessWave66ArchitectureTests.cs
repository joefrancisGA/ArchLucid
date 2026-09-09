using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-66 architecture create/review robustness suggestions 777–788.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave66ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion777_779_policy_pack_crud_mutation_sealed_guard_and_openapi_409()
    {
        string policyCrud = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Crud.cs"));
        string policyFacadeCrud = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PolicyPacks",
                "PolicyPackHttpFacade.Crud.cs"));
        string policyMutationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "PolicyPacks",
                "PolicyPackHttpFacade.MutationSealedManifestGuard.cs"));

        policyCrud.Should().Contain("Create");
        policyCrud.Should().Contain("Publish");
        policyCrud.Should().Contain("DeletePack");
        policyCrud.Should().Contain("DuplicatePack");
        policyCrud.Should().Contain("Status409Conflict");
        policyCrud.Should().Contain("ConflictException");
        policyFacadeCrud.Should().Contain("EnsureMutationSealedManifestOrThrowAsync");
        policyMutationGuard.Should().Contain("GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync");
    }

    [Fact]
    public void Suggestion778_policy_pack_assignment_mutation_sealed_guard_and_openapi_409()
    {
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

        policyAssignment.Should().Contain("SetAssignmentEnabled");
        policyAssignment.Should().Contain("SetAssignmentOrganizationRequired");
        policyAssignment.Should().Contain("Status409Conflict");
        policyAssignment.Should().Contain("ConflictException");
        policyFacadeCrud.Should().Contain("SetAssignmentEnabledAsync");
        policyFacadeCrud.Should().Contain("SetAssignmentOrganizationRequiredAsync");
    }

    [Fact]
    public void Suggestion780_782_draft_intake_mutation_sealed_guard_and_openapi_409()
    {
        string draftQuestions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Questions.cs"));
        string draftAdmit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AdmitSubmit.cs"));
        string draftBranch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.Branch.cs"));
        string draftAbandonReopen = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AbandonReopen.cs"));
        string draftCloneSnapshot = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.CloneSnapshot.cs"));

        draftQuestions.Should().Contain("AnswerQuestion");
        draftQuestions.Should().Contain("SkipQuestion");
        draftQuestions.Should().Contain("ReasonDraft");
        draftQuestions.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftQuestions.Should().Contain("Status409Conflict");
        draftAdmit.Should().Contain("AdmitDraft");
        draftAdmit.Should().Contain("Status409Conflict");
        draftBranch.Should().Contain("BranchDraft");
        draftBranch.Should().Contain("Status409Conflict");
        draftAbandonReopen.Should().Contain("AbandonDraft");
        draftAbandonReopen.Should().Contain("ReopenDraft");
        draftAbandonReopen.Should().Contain("Status409Conflict");
        draftCloneSnapshot.Should().Contain("CloneDraftSnapshot");
        draftCloneSnapshot.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion783_788_mutation_blocked_reason_ui_wiring()
    {
        string policyMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-mutation-blocked-reason.ts"));
        string policyCreatePublish = File.ReadAllText(
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
        string policyWorkspaceSelection = File.ReadAllText(
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
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftAdmitHook = File.ReadAllText(
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
        string draftSubmitHook = File.ReadAllText(
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
        string riskExceptionClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "use-risk-exceptions-client.ts"));
        string riskExceptionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));
        string findingFeedback = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "FindingFeedbackThumbs.tsx"));
        string findingFeedbackBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-feedback-mutation-blocked-reason.ts"));
        string advisoryScans = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "advisory",
                "use-advisory-scans-content.ts"));
        string advisoryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "advisory",
                "advisory-recommendation-apply-mutation-blocked-reason.ts"));
        string commitRunButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CommitRunButton.tsx"));
        string finalizeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-finalize-mutation-blocked-reason.ts"));

        policyMutationBlocked.Should().Contain("policyPackMutationBlockedReason");
        policyCreatePublish.Should().Contain("policyPackMutationBlockedReason");
        policyWorkspaceSelection.Should().Contain("policyPackMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftAdmitHook.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftSubmitHook.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        riskExceptionClient.Should().Contain("riskExceptionMutationBlockedReason");
        riskExceptionBlocked.Should().Contain("riskExceptionMutationBlockedReason");
        findingFeedback.Should().Contain("findingFeedbackMutationBlockedReason");
        findingFeedbackBlocked.Should().Contain("findingFeedbackMutationBlockedReason");
        advisoryScans.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        advisoryBlocked.Should().Contain("advisoryRecommendationApplyMutationBlockedReason");
        commitRunButton.Should().Contain("reviewFinalizeMutationBlockedReason");
        finalizeBlocked.Should().Contain("reviewFinalizeMutationBlockedReason");
    }
}
