using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-101 architecture create/review robustness suggestions 1197–1208.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave101ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1197_1199_manifest_compare_lifecycle_and_inventory_sealed_manifest_conflict_mappers()
    {
        string comparisonController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonController.cs"));

        comparisonController.Should().Contain("MapComparisonSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1200_1203_compare_explain_sealed_manifest_conflict_mappers()
    {
        string explanationCompare = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));

        explanationCompare.Should().Contain("MapExplanationSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1204_1208_governance_draft_risk_and_recurrence_blocked_reason_wiring()
    {
        string governanceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-mutation-blocked-reason.ts"));
        string governanceApprovalsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string draftBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftLifecycleApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string riskBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));
        string recurrenceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "recurrence-schedule-mutation-blocked-reason.ts"));
        string stickinessApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-exceptions-schedules.ts"));

        governanceBlocked.Should().Contain("governanceWorkflowMutationBlockedReason");
        governanceApprovalsApi.Should().Contain("governanceWorkflowMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftLifecycleApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        riskBlocked.Should().Contain("riskExceptionMutationBlockedReason");
        recurrenceBlocked.Should().Contain("recurrenceScheduleMutationBlockedReason");
        stickinessApi.Should().Contain("riskExceptionMutationBlockedReason");
        stickinessApi.Should().Contain("recurrenceScheduleMutationBlockedReason");
    }
}
