using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-95 architecture create/review robustness suggestions 1125–1136.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave95ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1125_1131_export_assignment_pilot_and_compare_action_level_sealed_manifest_conflict_mappers()
    {
        string architectureExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArchitectureExportController.cs"));
        string runsExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsExportController.cs"));
        string docxExport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "DocxExportController.cs"));
        string policyAssignment = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string pilotPacks = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsController.Packs.cs"));
        string authorityCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityCompareController.cs"));

        architectureExport.Should().Contain("MapArchitectureExportSealedManifestConflict");
        runsExport.Should().Contain("MapRunsExportSealedManifestConflict");
        docxExport.Should().Contain("MapDocxExportSealedManifestConflict");
        policyAssignment.Should().Contain("MapPolicyPackSealedManifestConflict");
        pilotPacks.Should().Contain("MapPilotPackSealedManifestConflict");
        authorityCompare.Should().Contain("MapCompareSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1132_1134_policy_assign_and_governance_environment_blocked_reason_wiring()
    {
        string assignBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-assign-mutation-blocked-reason.ts"));
        string assignApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));
        string workflowBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-mutation-blocked-reason.ts"));
        string catalogBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-environment-catalog-mutation-blocked-reason.ts"));
        string environmentsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-environments.ts"));

        assignBlocked.Should().Contain("policyPackAssignMutationBlockedReason");
        assignApi.Should().Contain("policyPackAssignMutationBlockedReason");
        workflowBlocked.Should().Contain("governanceWorkflowMutationBlockedReason");
        catalogBlocked.Should().Contain("governanceEnvironmentCatalogMutationBlockedReason");
        environmentsApi.Should().Contain("governanceWorkflowMutationBlockedReason");
        environmentsApi.Should().Contain("governanceEnvironmentCatalogMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1135_1136_review_pin_and_sponsor_pack_sent_blocked_reason_wiring()
    {
        string pinBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-pin-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string sponsorSentBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-pack-sent-mutation-blocked-reason.ts"));
        string exportJobsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "downloads-export-jobs.ts"));

        pinBlocked.Should().Contain("reviewPinMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewPinMutationBlockedReason");
        sponsorSentBlocked.Should().Contain("sponsorPackSentMutationBlockedReason");
        exportJobsApi.Should().Contain("sponsorPackSentMutationBlockedReason");
    }
}
