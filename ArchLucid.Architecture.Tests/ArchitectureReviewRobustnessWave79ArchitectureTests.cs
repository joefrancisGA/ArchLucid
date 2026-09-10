using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-79 architecture create/review robustness suggestions 933–944.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave79ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion933_941_infra_inventory_advisory_authority_and_explanation_openapi_409()
    {
        string diffsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceDiffsController.cs"));
        string diffsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceDiffsController.SealedManifestGuard.cs"));
        string inventoryController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceInventoryController.cs"));
        string inventoryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceInventoryController.SealedManifestGuard.cs"));
        string advisoryController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Advisory", "AdvisoryController.cs"));
        string advisoryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "AdvisoryController.SealedManifestGuard.cs"));
        string authorityReads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityReadsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReadsController.SealedManifestGuard.cs"));
        string authorityTrail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.Trail.cs"));
        string authorityRunDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.RunDetail.cs"));
        string authorityQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.SealedManifestGuard.cs"));
        string runExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.RunExplain.cs"));
        string findingExplain = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.FindingExplain.cs"));
        string holisticCritic = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));
        string explainGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.SealedManifestGuard.cs"));

        diffsController.Should().Contain("ListChangesForDiff");
        diffsController.Should().Contain("MapDiffSealedManifestConflict");
        diffsController.Should().Contain("Status409Conflict");
        diffsGuard.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        inventoryController.Should().Contain("GetDriftReport");
        inventoryController.Should().Contain("BuildNarrative");
        inventoryController.Should().Contain("MapInventorySealedManifestConflict");
        inventoryGuard.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        advisoryController.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        advisoryGuard.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        authorityReadsGuard.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        authorityTrail.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        authorityRunDetail.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        authorityRunDetail.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        authorityQueryGuard.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        runExplain.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        findingExplain.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        holisticCritic.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        explainGuard.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
    }

    [Fact]
    public void Suggestion942_943_drift_and_diagrams_mutation_blocked_reason_wiring()
    {
        string driftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-drift-mutation-blocked-reason.ts"));
        string driftApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-drift-api.ts"));
        string driftWorkbench = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "drift",
                "DriftWorkbenchClient.tsx"));
        string diagramsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-diagrams-mutation-blocked-reason.ts"));
        string diagramsApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-diagrams-api.ts"));
        string diagramsWorkbench = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "diagrams",
                "DiagramsWorkbenchClient.tsx"));

        driftBlocked.Should().Contain("infraEvidenceDriftMutationBlockedReason");
        driftApi.Should().Contain("infraEvidenceDriftMutationBlockedReason");
        driftWorkbench.Should().Contain("formatInfraEvidenceApiError");
        diagramsBlocked.Should().Contain("infraEvidenceDiagramsMutationBlockedReason");
        diagramsApi.Should().Contain("infraEvidenceDiagramsMutationBlockedReason");
        diagramsWorkbench.Should().Contain("formatInfraEvidenceDiagramsApiError");
    }

    [Fact]
    public void Suggestion944_resource_hub_and_explorer_blocked_reason_wiring()
    {
        string hubApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-hub-api.ts"));
        string remediationApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-remediation-api.ts"));
        string resourcesExplorer = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "resources",
                "ResourcesExplorerClient.tsx"));
        string resourceHub = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "resources",
                "[cloudResourceId]",
                "ResourceHubClient.tsx"));

        hubApi.Should().Contain("infraEvidenceHubBlockedReason");
        remediationApi.Should().Contain("remediationInstanceMutationBlockedReason");
        resourcesExplorer.Should().Contain("formatInfraEvidenceHubApiError");
        resourceHub.Should().Contain("formatInfraEvidenceHubApiError");
        resourceHub.Should().Contain("formatInfraEvidenceRemediationApiError");
    }
}
