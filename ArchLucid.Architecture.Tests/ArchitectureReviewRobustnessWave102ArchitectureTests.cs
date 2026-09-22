using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-102 architecture create/review robustness suggestions 1209–1220.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave102ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1209_1211_compare_explain_and_policy_pack_sealed_manifest_conflict_mappers()
    {
        string explanationCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));
        string policyAssignment = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));

        explanationCompare.Should().Contain("MapExplanationSealedManifestConflict");
        policyAssignment.Should().Contain("MapPolicyPackSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1212_1215_demo_viewer_compare_sealed_manifest_conflict_mappers()
    {
        string demoCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Demo",
                "DemoViewerController.Compare.cs"));
        string demoGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Demo",
                "DemoViewerController.SealedManifestGuard.cs"));

        demoCompare.Should().Contain("MapDemoViewerSealedManifestConflict");
        demoGuard.Should().Contain("MapDemoViewerSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1216_1220_draft_intake_and_recurrence_blocked_reason_wiring()
    {
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftCrudApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-crud.ts"));
        string draftQuestionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-questions.ts"));
        string draftLifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string recurrenceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "recurrence-schedule-mutation-blocked-reason.ts"));
        string stickinessApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-exceptions-schedules.ts"));

        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftCrudApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftQuestionsApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftLifecycleApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        recurrenceBlocked.Should().Contain("recurrenceScheduleMutationBlockedReason");
        stickinessApi.Should().Contain("recurrenceScheduleMutationBlockedReason");
    }
}
