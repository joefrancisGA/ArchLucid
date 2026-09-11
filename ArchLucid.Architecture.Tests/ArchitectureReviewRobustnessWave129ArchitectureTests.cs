using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-129 architecture create/review robustness suggestions 1533–1544.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave129ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1533_1538_draft_wizard_and_compare_runtime_409_mappers()
    {
        string draftController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.cs"));
        string draftList = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.List.cs"));
        string draftQuestions = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.Questions.cs"));
        string draftLifecycle = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.Lifecycle.Branch.cs"));
        string draftGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.SealedManifestGuard.cs"));
        string wizardController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "WizardIntakeDraftsController.cs"));
        string compareController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.cs"));

        draftController.Should().Contain("GetDraft");
        draftController.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftList.Should().Contain("ListDrafts");
        draftList.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftQuestions.Should().Contain("GetDraftQuestions");
        draftQuestions.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftLifecycle.Should().Contain("GetDraftBranchQuota");
        draftLifecycle.Should().Contain("DownloadDraftDecisionReceipt");
        draftLifecycle.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftGuard.Should().Contain("DraftIntakeSealedManifestReadGuard");
        wizardController.Should().Contain("GetDraft");
        wizardController.Should().Contain("MapWizardIntakeDraftSealedManifestConflict");
        compareController.Should().Contain("CompareRuns");
        compareController.Should().Contain("MapComparisonSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1539_1540_draft_list_questions_and_branch_quota_api_get_blocked_reason_wiring()
    {
        string draftCrudApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-crud.ts"));
        string draftQuestionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-questions.ts"));
        string draftLifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string draftListHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-list-query.ts"));
        string draftListBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-list-blocked-reason.ts"));
        string draftListShell = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureDraftListShell.tsx"));
        string presenterPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "reviews", "ReviewRoomElicitationPanel.tsx"));
        string branchQuotaPanel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "draft-intake", "DraftIntakeWhatIfBranchPanel.tsx"));

        draftCrudApi.Should().Contain("listDraftRequests");
        draftCrudApi.Should().Contain("apiGet");
        draftCrudApi.Should().Contain("architectureDraftListBlockedReason");
        draftQuestionsApi.Should().Contain("getDraftQuestions");
        draftQuestionsApi.Should().Contain("apiGet");
        draftQuestionsApi.Should().Contain("architectureDraftQuestionsBlockedReason");
        draftLifecycleApi.Should().Contain("getDraftBranchQuota");
        draftLifecycleApi.Should().Contain("apiGet");
        draftLifecycleApi.Should().Contain("architectureDraftBranchQuotaBlockedReason");
        draftListHook.Should().Contain("architectureDraftListBlockedReason");
        draftListBlocked.Should().Contain("architectureDraftQuestionsBlockedReason");
        draftListBlocked.Should().Contain("architectureDraftBranchQuotaBlockedReason");
        draftListShell.Should().Contain("architecture-draft-list-blocked-reason");
        presenterPanel.Should().Contain("questionsBlockedReason");
        presenterPanel.Should().Contain("review-presenter-questions-blocked-reason");
        branchQuotaPanel.Should().Contain("draft-intake-branch-quota-blocked-reason");
    }

    [Fact]
    public void Suggestion1541_1544_export_compare_and_assurance_hook_ui_wiring()
    {
        string exportStatusCallout = File.ReadAllText(
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
                "RunDetailExportRecordStatusCallout.tsx"));
        string assuranceCallouts = File.ReadAllText(
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
                "RunDetailAssuranceGuardCallouts.tsx"));
        string runDetailExports = File.ReadAllText(
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
        string replayCost = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "ArchitectureComparisonReplayCostSection.tsx"));
        string compareDiffStack = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelDiffStack.tsx"));
        string compareAgentCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareAgentResultsBlockedCallout.tsx"));
        string coverageGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "wizard", "ReviewAssuranceCoverageGuardCallout.tsx"));

        exportStatusCallout.Should().Contain("useExportRecordQuery");
        assuranceCallouts.Should().Contain("useExportLineageVerifyQuery");
        assuranceCallouts.Should().Contain("useRunComparisonHistoryQuery");
        runDetailExports.Should().Contain("RunDetailExportRecordStatusCallout");
        runDetailExports.Should().Contain("RunDetailAssuranceGuardCallouts");
        replayCost.Should().Contain("useComparisonRecordQuery");
        replayCost.Should().Contain("comparison-record-blocked-reason");
        compareDiffStack.Should().Contain("CompareAgentResultsBlockedCallout");
        compareAgentCallout.Should().Contain("useCompareAgentResultsQuery");
        coverageGuard.Should().Contain("useGovernanceScopeCoverageQuery");
    }
}
