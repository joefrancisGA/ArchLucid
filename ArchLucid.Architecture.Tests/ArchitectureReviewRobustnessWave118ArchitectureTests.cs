using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-118 architecture create/review robustness suggestions 1401–1412.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave118ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1401_1407_run_findings_advisory_and_architecture_request_sealed_manifest_mappers()
    {
        string findings = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));
        string advisory = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));
        string advisoryGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.SealedManifestGuard.cs"));
        string architectureRequests = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.ArchitectureRequests.cs"));
        string runsGuard = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunsController.SealedManifestGuard.cs"));

        findings.Should().Contain("ListRunFindings");
        findings.Should().Contain("ExportRunFindingsCsv");
        findings.Should().Contain("MapProductRunQuerySealedManifestConflict");
        advisory.Should().Contain("GetImprovements");
        advisory.Should().Contain("ListRecommendations");
        advisory.Should().Contain("MapAdvisorySealedManifestConflict");
        advisoryGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        advisoryGuard.Should().Contain("MapAdvisorySealedManifestConflict");
        architectureRequests.Should().Contain("GetRequest");
        architectureRequests.Should().Contain("MapRunsSealedManifestConflict");
        runsGuard.Should().Contain("EnsureArchitectureRequestSealedManifestReadAllowedAsync");
        runsGuard.Should().Contain("MapRunsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1408_1411_architecture_request_and_advisory_read_blocked_reason_wiring()
    {
        string architectureRequestList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string architectureRequestBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "architecture-request-blocked-reason.ts"));
        string advisoryApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory-api.ts"));
        string advisoryBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "advisory", "advisory-run-read-blocked-reason.ts"));
        string learningEvolution = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "learning-evolution-api.ts"));
        string architectureRequestQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-request-query.ts"));
        string advisoryRecommendationsQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-advisory-recommendations-query.ts"));

        architectureRequestList.Should().Contain("getArchitectureRequest");
        architectureRequestList.Should().Contain("architectureRequestBlockedReason");
        architectureRequestBlocked.Should().Contain("architectureRequestBlockedReason");
        advisoryApi.Should().Contain("listRecommendations");
        advisoryApi.Should().Contain("advisoryRunReadBlockedReason");
        advisoryBlocked.Should().Contain("advisoryRunReadBlockedReason");
        learningEvolution.Should().Contain("getImprovementPlan");
        learningEvolution.Should().Contain("advisoryRunReadBlockedReason");
        architectureRequestQuery.Should().Contain("architectureRequestBlockedReason");
        advisoryRecommendationsQuery.Should().Contain("advisoryRunReadBlockedReason");
    }

    [Fact]
    public void Suggestion1412_advisory_scans_bootstrap_fail_closed_ux()
    {
        string advisoryScansContent = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "AdvisoryScansContent.tsx"));
        string advisoryScansHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "advisory", "use-advisory-scans-content.ts"));

        advisoryScansContent.Should().Contain("advisory-run-read-blocked-reason");
        advisoryScansContent.Should().Contain("bootstrapBlockedReason");
        advisoryScansHook.Should().Contain("bootstrapBlockedReason");
        advisoryScansHook.Should().Contain("getImprovementPlan");
    }
}
