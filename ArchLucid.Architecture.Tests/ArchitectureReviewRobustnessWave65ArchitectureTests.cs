using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-65 architecture create/review robustness suggestions 765–776.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave65ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion765_768_773_attestation_recurrence_and_policy_simulate_openapi_409()
    {
        string attestationController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Attestation.cs"));
        string schedulesController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Schedules.cs"));
        string recurrenceFacade = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Stickiness",
                "GovernanceStickinessFacade.Recurrence.cs"));
        string policySimulate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Simulate.cs"));

        attestationController.Should().Contain("UpsertRealizedValueAttestation");
        attestationController.Should().Contain("Status409Conflict");
        attestationController.Should().Contain("ConflictException");
        recurrenceFacade.Should().Contain("UpsertRealizedValueAttestationAsync");
        recurrenceFacade.Should().Contain("EnsureRegistersSealedManifestOrThrowAsync");
        recurrenceFacade.Should().Contain("UpdateRecurrenceScheduleAsync");
        schedulesController.Should().Contain("CreateRecurrenceSchedule");
        schedulesController.Should().Contain("UpdateRecurrenceSchedule");
        schedulesController.Should().Contain("Status409Conflict");
        schedulesController.Should().Contain("ConflictException");
        policySimulate.Should().Contain("Simulate");
        policySimulate.Should().Contain("SimulateBulk");
        policySimulate.Should().Contain("Status409Conflict");
        policySimulate.Should().Contain("ConflictException");
    }

    [Fact]
    public void Suggestion766_770_realized_value_workflow_and_review_context_ui_wiring()
    {
        string attestationMutationHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-realized-value-attestation-mutation.ts"));
        string attestationMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "realized-value-attestation-mutation-blocked-reason.ts"));
        string workflowMutations = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-workflow-mutations.ts"));
        string workflowMutationHost = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "GovernanceWorkflowMutationHost.tsx"));
        string workflowMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-mutation-blocked-reason.ts"));
        string reviewContextLoader = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "load-governance-review-context.ts"));
        string reviewContextHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-review-context-query.ts"));
        string reviewContextBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-review-context-blocked-reason.ts"));
        string reviewContextCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceReviewContextBlockedCallout.tsx"));

        attestationMutationHook.Should().Contain("realizedValueAttestationMutationBlockedReason");
        attestationMutationBlocked.Should().Contain("realizedValueAttestationMutationBlockedReason");
        workflowMutations.Should().Contain("governanceWorkflowMutationBlockedReason");
        workflowMutationHost.Should().Contain("governance-workflow-mutation-blocked");
        workflowMutationBlocked.Should().Contain("governanceWorkflowMutationBlockedReason");
        reviewContextLoader.Should().Contain("governanceReviewContextBlockedReason");
        reviewContextHook.Should().Contain("governanceReviewContextBlockedReason");
        reviewContextCallout.Should().Contain("governance-review-context-blocked");
        reviewContextBlocked.Should().Contain("governanceReviewContextBlockedReason");
    }

    [Fact]
    public void Suggestion769_772_recurrence_keyboard_disposition_and_policy_simulate_ui_wiring()
    {
        string recurrenceClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "use-recurrence-schedules-client.ts"));
        string recurrenceCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "RecurrenceScheduleCreatePanel.tsx"));
        string recurrenceMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "recurrence-schedule-mutation-blocked-reason.ts"));
        string keyboardHost = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "findings",
                "FindingKeyboardTriageHost.tsx"));
        string keyboardBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-keyboard-disposition-blocked-reason.ts"));
        string policyPreview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "policy",
                "PolicyPackImpactPreviewPanel.tsx"));
        string policyBuilder = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "policy-packs",
                "_sections",
                "use-policy-pack-visual-builder.ts"));
        string policySimulateBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-simulate-blocked-reason.ts"));

        recurrenceClient.Should().Contain("recurrenceScheduleMutationBlockedReason");
        recurrenceCreate.Should().Contain("recurrenceScheduleMutationBlockedReason");
        recurrenceMutationBlocked.Should().Contain("recurrenceScheduleMutationBlockedReason");
        keyboardHost.Should().Contain("findingKeyboardDispositionBlockedReason");
        keyboardBlocked.Should().Contain("findingKeyboardDispositionBlockedReason");
        policyPreview.Should().Contain("policyPackSimulateBlockedReason");
        policyBuilder.Should().Contain("policyPackSimulateBlockedReason");
        policySimulateBlocked.Should().Contain("policyPackSimulateBlockedReason");
    }

    [Fact]
    public void Suggestion775_776_pre_finalize_simulate_and_draft_autosave_ui_wiring()
    {
        string preFinalizeSimulateApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "pre-finalize-synthetic-simulation-api.ts"));
        string commitRunButton = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "CommitRunButton.tsx"));
        string preFinalizeSimulateBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "pre-finalize-synthetic-simulation-blocked-reason.ts"));
        string draftAutosave = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-autosave-persist.ts"));
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));

        preFinalizeSimulateApi.Should().Contain("simulatePreCommitSyntheticFindings");
        commitRunButton.Should().Contain("simulatePreCommitSyntheticFindings");
        commitRunButton.Should().Contain("preFinalizeSyntheticSimulationBlockedReason");
        preFinalizeSimulateBlocked.Should().Contain("preFinalizeSyntheticSimulationBlockedReason");
        draftAutosave.Should().Contain("architectureDraftAutosavePatchBlockedReason");
        draftBlocked.Should().Contain("architectureDraftAutosavePatchBlockedReason");
    }
}
