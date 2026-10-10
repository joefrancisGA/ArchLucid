using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-61 architecture create/review robustness suggestions 717–728.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave61ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion717_720_draft_get_list_questions_and_lifecycle_openapi_409()
    {
        string draftController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.cs"));
        string draftList = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.List.cs"));
        string draftQuestions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.Questions.cs"));
        string draftLifecycle = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.Lifecycle.Branch.cs"));
        string draftGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "DraftRequestsController.SealedManifestGuard.cs"));
        string intakeGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Drafts", "DraftIntakeSealedManifestReadGuard.cs"));

        draftController.Should().Contain("GetDraft");
        draftController.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftController.Should().Contain("Status409Conflict");
        draftList.Should().Contain("ListDrafts");
        draftList.Should().Contain("EnsureDraftIntakeSealedManifestReadAllowedAsync");
        draftQuestions.Should().Contain("GetDraftQuestions");
        draftQuestions.Should().Contain("Status409Conflict");
        draftLifecycle.Should().Contain("GetDraftBranchQuota");
        draftLifecycle.Should().Contain("DownloadDraftDecisionReceipt");
        draftGuard.Should().Contain("DraftIntakeSealedManifestReadGuard");
        intakeGuard.Should().Contain("RunInventorySealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion721_722_wizard_intake_and_compare_openapi_409()
    {
        string wizardController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "WizardIntakeDraftsController.cs"));
        string wizardGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "WizardIntakeDraftsController.SealedManifestGuard.cs"));
        string compareController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.cs"));
        string compareGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonController.SealedManifestGuard.cs"));

        wizardController.Should().Contain("EnsureWizardIntakeDraftSealedManifestReadAllowedAsync");
        wizardController.Should().Contain("Status409Conflict");
        wizardGuard.Should().Contain("DraftIntakeSealedManifestReadGuard");
        compareController.Should().Contain("CompareRuns");
        compareController.Should().Contain("EnsureCompareRunsSealedManifestReadAllowedAsync");
        compareController.Should().Contain("Status409Conflict");
        compareGuard.Should().Contain("SealedManifestReadGuard");
    }

    [Fact]
    public void Suggestion723_724_draft_list_questions_and_branch_quota_sealed_clients()
    {
        string draftCrudApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-crud.ts"));
        string draftQuestionsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-questions.ts"));
        string draftLifecycleApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string draftListHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-list-query.ts"));
        string draftListBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-draft-list-blocked-reason.ts"));
        string draftListShell = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureDraftListShell.tsx"));
        string presenterHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-presenter-elicitation.ts"));
        string branchQuotaHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-draft-branch-quota-query.ts"));

        draftCrudApi.Should().Contain("listDraftRequests");
        draftCrudApi.Should().Contain("apiGetSealedManifestAware");
        draftQuestionsApi.Should().Contain("getDraftQuestions");
        draftQuestionsApi.Should().Contain("apiGetSealedManifestAware");
        draftLifecycleApi.Should().Contain("getDraftBranchQuota");
        draftLifecycleApi.Should().Contain("apiGetSealedManifestAware");
        draftListHook.Should().Contain("architectureDraftListBlockedReason");
        draftListBlocked.Should().Contain("architectureDraftListBlockedReason");
        draftListShell.Should().Contain("architecture-draft-list-blocked-reason");
        presenterHook.Should().Contain("architectureDraftQuestionsBlockedReason");
        branchQuotaHook.Should().Contain("architectureDraftBranchQuotaBlockedReason");
    }

    [Fact]
    public void Suggestion725_728_export_compare_and_assurance_hook_ui_wiring()
    {
        string exportStatusCallout = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string assuranceCallouts = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string runDetailExports = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string replayCost = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string compareDiffStack = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string compareAgentCallout = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string coverageGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "wizard", "ReviewAssuranceCoverageGuardCallout.tsx"));
        string coverageSection = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "wizard", "ReviewAssuranceCoverageSection.tsx"));

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
        coverageSection.Should().Contain("ReviewAssuranceCoverageGuardCallout");
    }
}
