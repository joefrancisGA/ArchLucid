using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-135 architecture create/review robustness suggestions 1605–1616.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave135ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1605_1610_draft_wizard_architecture_and_governance_mutation_runtime_409_mappers()
    {
        string draftController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.cs"));
        string draftGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.SealedManifestGuard.cs"));
        string wizardDrafts = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "WizardIntakeDraftsController.cs"));
        string architectures = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.cs"));
        string architectureGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.SealedManifestGuard.cs"));
        string promotions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PromotionsActivations.cs"));
        string approvalCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Create.cs"));
        string approvalBatch = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Batch.cs"));

        draftController.Should().Contain("CreateDraft");
        draftController.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftGuard.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        wizardDrafts.Should().Contain("UpsertDraft");
        wizardDrafts.Should().Contain("EnsureWizardIntakeDraftSealedManifestReadAllowedAsync");
        wizardDrafts.Should().Contain("MapWizardIntakeDraftSealedManifestConflict");
        architectures.Should().Contain("PatchArchitecture");
        architectures.Should().Contain("MapArchitectureSealedManifestConflict");
        architectures.Should().Contain("EnsureArchitectureIdentityMutationSealedManifestAllowedAsync");
        architectureGuard.Should().Contain("GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync");
        promotions.Should().Contain("Promote");
        promotions.Should().Contain("Activate");
        promotions.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        approvalCreate.Should().Contain("SubmitApprovalRequest");
        approvalCreate.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        approvalBatch.Should().Contain("BatchReviewApprovalRequests");
        approvalBatch.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
    }

    [Fact]
    public void Suggestion1611_1614_create_coverage_disposition_and_correction_ui_wiring()
    {
        string createRunBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-create-mutation-blocked-reason.ts"));
        string wizardSubmit = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "wizard-form-create-run-submit.ts"));
        string firstPilotSubmit = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "new",
                "use-first-pilot-intake-submit.ts"));
        string coverageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-coverage-acknowledgement-mutation-blocked-reason.ts"));
        string dispositions = File.ReadAllText(
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
                "use-finding-inspect-governance-stickiness-dispositions.ts"));
        string dispositionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-disposition-mutation-blocked-reason.ts"));
        string correctionDialog = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceRecordCorrectionDialog.tsx"));
        string correctionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-mutation-correction-blocked-reason.ts"));

        createRunBlocked.Should().Contain("architectureRequestCreateMutationBlockedReason");
        wizardSubmit.Should().Contain("architectureRequestCreateMutationBlockedReason");
        wizardSubmit.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        firstPilotSubmit.Should().Contain("resolveCreateRunFailureMessage");
        coverageBlocked.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        dispositions.Should().Contain("findingDispositionMutationBlockedReason");
        dispositionBlocked.Should().Contain("findingDispositionMutationBlockedReason");
        correctionDialog.Should().Contain("governanceMutationCorrectionBlockedReason");
        correctionBlocked.Should().Contain("governanceMutationCorrectionBlockedReason");
    }

    [Fact]
    public void Suggestion1615_1616_wizard_and_draft_create_fail_closed_ui_wiring()
    {
        string wizardBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "wizard-intake-draft-mutation-blocked-reason.ts"));
        string wizardPersistence = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-wizard-session-persistence.ts"));
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftCreateHook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "new",
                "use-guided-intake-draft-create.ts"));
        string creationInit = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-creation-init.ts"));
        string autosavePersist = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-autosave-persist.ts"));
        string resumeControl = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureDraftResumeControl.tsx"));

        wizardBlocked.Should().Contain("wizardIntakeDraftMutationBlockedReason");
        wizardPersistence.Should().Contain("wizardIntakeDraftMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftCreateMutationBlockedReason");
        draftCreateHook.Should().Contain("architectureDraftCreateMutationBlockedReason");
        creationInit.Should().Contain("architectureDraftCreateMutationBlockedReason");
        autosavePersist.Should().Contain("architectureDraftCreateMutationBlockedReason");
        resumeControl.Should().Contain("architectureDraftIntakeMutationBlockedReason");
    }
}
