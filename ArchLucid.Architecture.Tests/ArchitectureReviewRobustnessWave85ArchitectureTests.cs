using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-85 architecture create/review robustness suggestions 1005–1016.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave85ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1005_1011_diagram_governance_policy_pilot_draft_and_architecture_openapi_409()
    {
        string diagramVision = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramVisionIngestController.cs"));
        string diagramVisionGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramVisionIngestController.SealedManifestGuard.cs"));
        string diagramReconcile = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramReconciliationController.cs"));
        string diagramReconcileGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "ArchitectureDiagramReconciliationController.SealedManifestGuard.cs"));
        string stickinessRegisters = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Registers.cs"));
        string stickinessDispositions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Dispositions.cs"));
        string stickinessAttestation = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.Attestation.cs"));
        string stickinessGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceStickinessController.SealedManifestGuard.cs"));
        string policySimulate = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Simulate.cs"));
        string policyAssignment = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Assignment.cs"));
        string policyGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.SealedManifestGuard.cs"));
        string pilotPacks = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));
        string pilotGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.SealedManifestGuard.cs"));
        string draftRequests = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.cs"));
        string draftAdmit = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.Lifecycle.AdmitSubmit.cs"));
        string draftGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "DraftRequestsController.SealedManifestGuard.cs"));
        string architectures = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.cs"));
        string architectureGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Architecture",
                "ArchitecturesController.SealedManifestGuard.cs"));

        diagramVision.Should().Contain("MapDiagramVisionIngestSealedManifestConflict");
        diagramVisionGuard.Should().Contain("MapDiagramVisionIngestSealedManifestConflict");
        diagramReconcile.Should().Contain("MapDiagramReconcileSealedManifestConflict");
        diagramReconcileGuard.Should().Contain("MapDiagramReconcileSealedManifestConflict");
        stickinessRegisters.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        stickinessDispositions.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        stickinessAttestation.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        stickinessGuard.Should().Contain("MapGovernanceStickinessSealedManifestConflict");
        policySimulate.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyAssignment.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyGuard.Should().Contain("MapPolicyPackSealedManifestConflict");
        pilotPacks.Should().Contain("MapPilotPackSealedManifestConflict");
        pilotGuard.Should().Contain("MapPilotPackSealedManifestConflict");
        draftRequests.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftAdmit.Should().Contain("MapDraftRequestSealedManifestConflict");
        draftGuard.Should().Contain("MapDraftRequestSealedManifestConflict");
        architectures.Should().Contain("MapArchitectureSealedManifestConflict");
        architectureGuard.Should().Contain("MapArchitectureSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1012_1014_graph_collateral_and_run_summary_blocked_reason_wiring()
    {
        string graphTemporalBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "architecture-graph-temporal-snapshot-blocked-reason.ts"));
        string graphApi = ArchitectureSourceProbe.ReadPathWithPartials(Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string collateralBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "pilots-collateral-mutation-blocked-reason.ts"));
        string collateralApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "pilots-collateral-download-api.ts"));
        string runSummaryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-summary-export-mutation-blocked-reason.ts"));
        string runSummaryApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-run-summary-export.ts"));

        graphTemporalBlocked.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        graphApi.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        collateralBlocked.Should().Contain("pilotsCollateralMutationBlockedReason");
        collateralApi.Should().Contain("pilotsCollateralMutationBlockedReason");
        runSummaryBlocked.Should().Contain("runSummaryExportMutationBlockedReason");
        runSummaryApi.Should().Contain("runSummaryExportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1015_1016_artifact_bundle_and_manifest_compare_blocked_reason_wiring()
    {
        string artifactBundleBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "artifact-bundle-mutation-blocked-reason.ts"));
        string artifactBundleApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-artifact-bundle.ts"));
        string manifestCompareBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "manifest-compare-export-mutation-blocked-reason.ts"));
        string manifestCompareApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "downloads-blob-trigger-manifest-compare-export.ts"));

        artifactBundleBlocked.Should().Contain("artifactBundleMutationBlockedReason");
        artifactBundleApi.Should().Contain("artifactBundleMutationBlockedReason");
        manifestCompareBlocked.Should().Contain("manifestCompareExportMutationBlockedReason");
        manifestCompareApi.Should().Contain("manifestCompareExportMutationBlockedReason");
    }
}
