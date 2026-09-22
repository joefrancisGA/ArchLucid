using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-99 architecture create/review robustness suggestions 1173–1184.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave99ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1173_1176_export_record_load_and_run_findings_query_sealed_manifest_conflict_mappers()
    {
        string exportsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ExportsController.cs"));
        string runFindings = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Findings.cs"));

        exportsController.Should().Contain("MapExportReplaySealedManifestConflict");
        runFindings.Should().Contain("MapProductRunQuerySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1177_1179_run_comparison_and_intake_service_sealed_manifest_conflict_mappers()
    {
        string runComparisonAgents = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.Agents.cs"));
        string runsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.cs"));

        runComparisonAgents.Should().Contain("MapRunComparisonSealedManifestConflict");
        runsController.Should().Contain("MapRunsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1180_1184_draft_lifecycle_risk_and_policy_activation_blocked_reason_wiring()
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
        string riskBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));
        string riskApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-exceptions-schedules.ts"));
        string policyBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-assign-mutation-blocked-reason.ts"));
        string policyApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));

        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftLifecycleApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        lifecycleBlocked.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        lifecycleApi.Should().Contain("architectureRequestLifecycleMutationBlockedReason");
        riskBlocked.Should().Contain("riskExceptionMutationBlockedReason");
        riskApi.Should().Contain("riskExceptionMutationBlockedReason");
        policyBlocked.Should().Contain("policyPackAssignMutationBlockedReason");
        policyApi.Should().Contain("policyPackAssignMutationBlockedReason");
    }
}
