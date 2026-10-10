using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-67 architecture create/review robustness suggestions 789–800.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave67ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion789_791_draft_wizard_and_architecture_identity_mutation_openapi_409()
    {
        string draftController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.cs"));
        string wizardDrafts = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "WizardIntakeDraftsController.cs"));
        string architectures = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.cs"));
        string architectureGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.SealedManifestGuard.cs"));

        draftController.Should().Contain("CreateDraft");
        draftController.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftController.Should().Contain("Status409Conflict");
        wizardDrafts.Should().Contain("UpsertDraft");
        wizardDrafts.Should().Contain("EnsureWizardIntakeDraftSealedManifestReadAllowedAsync");
        wizardDrafts.Should().Contain("Status409Conflict");
        architectures.Should().Contain("PatchArchitecture");
        architectures.Should().Contain("EnsureArchitectureIdentityMutationSealedManifestAllowedAsync");
        architectures.Should().Contain("Status409Conflict");
        architectures.Should().Contain("ConflictException");
        architectureGuard.Should().Contain("EnsureArchitectureIdentityMutationSealedManifestAllowedAsync");
        architectureGuard.Should().Contain("GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync");
    }

    [Fact]
    public void Suggestion792_794_governance_promotion_activation_and_approval_mutation_openapi_409()
    {
        string promotions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PromotionsActivations.cs"));
        string approvalCreate = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Create.cs"));
        string approvalBatch = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Batch.cs"));

        promotions.Should().Contain("Promote");
        promotions.Should().Contain("Activate");
        promotions.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        promotions.Should().Contain("Status409Conflict");
        approvalCreate.Should().Contain("SubmitApprovalRequest");
        approvalCreate.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        approvalCreate.Should().Contain("Status409Conflict");
        approvalBatch.Should().Contain("BatchReviewApprovalRequests");
        approvalBatch.Should().Contain("EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync");
        approvalBatch.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion795_798_create_coverage_disposition_and_correction_mutation_blocked_reason_ui_wiring()
    {
        string createRunBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-create-mutation-blocked-reason.ts"));
        string wizardSubmit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "wizard-form-create-run-submit.ts"));
        string coverageBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-coverage-acknowledgement-mutation-blocked-reason.ts"));
        string dispositions = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string dispositionBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-disposition-mutation-blocked-reason.ts"));
        string correctionDialog = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceRecordCorrectionDialog.tsx"));
        string correctionBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
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
        coverageBlocked.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        dispositions.Should().Contain("findingDispositionMutationBlockedReason");
        dispositionBlocked.Should().Contain("findingDispositionMutationBlockedReason");
        correctionDialog.Should().Contain("governanceMutationCorrectionBlockedReason");
        correctionBlocked.Should().Contain("governanceMutationCorrectionBlockedReason");
    }

    [Fact]
    public void Suggestion799_800_wizard_and_draft_create_mutation_blocked_reason_ui_wiring()
    {
        string wizardBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "wizard-intake-draft-mutation-blocked-reason.ts"));
        string wizardPersistence = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-wizard-session-persistence.ts"));
        string draftBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftCreateHook = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string creationInit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-creation-init.ts"));
        string autosavePersist = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-autosave-persist.ts"));

        wizardBlocked.Should().Contain("wizardIntakeDraftMutationBlockedReason");
        wizardPersistence.Should().Contain("wizardIntakeDraftMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftCreateMutationBlockedReason");
        draftCreateHook.Should().Contain("architectureDraftCreateMutationBlockedReason");
        creationInit.Should().Contain("architectureDraftCreateMutationBlockedReason");
        autosavePersist.Should().Contain("architectureDraftCreateMutationBlockedReason");
    }
}
