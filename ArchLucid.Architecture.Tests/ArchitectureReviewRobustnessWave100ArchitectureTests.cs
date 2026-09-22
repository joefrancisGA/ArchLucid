using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-100 architecture create/review robustness suggestions 1185–1196.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave100ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1185_1187_run_comparison_agent_pair_load_sealed_manifest_conflict_mappers()
    {
        string runComparisonAgents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.Agents.cs"));

        runComparisonAgents.Should().Contain("MapRunComparisonSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1188_1191_draft_async_and_manifest_compare_sealed_manifest_conflict_mappers()
    {
        string draftAsync = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Intake.DraftAsync.cs"));
        string comparisonController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ComparisonController.cs"));

        draftAsync.Should().Contain("MapRunsSealedManifestConflict");
        comparisonController.Should().Contain("MapComparisonSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1192_1196_draft_governance_and_lifecycle_delete_blocked_reason_wiring()
    {
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftLifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string lifecycleBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-lifecycle-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string governanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-mutation-blocked-reason.ts"));
        string governanceApprovalsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));

        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftLifecycleApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        lifecycleBlocked.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        lifecycleApi.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        governanceBlocked.Should().Contain("governanceWorkflowMutationBlockedReason");
        governanceApprovalsApi.Should().Contain("governanceWorkflowMutationBlockedReason");
    }
}
