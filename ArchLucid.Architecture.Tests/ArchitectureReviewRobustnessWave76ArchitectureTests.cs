using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-76 architecture create/review robustness suggestions 897–908.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave76ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion897_903_policy_pilot_finding_and_diagram_mutation_openapi_409()
    {
        string policySimulate = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Governance/PolicyPacksController.Simulate.cs");
        string policyGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Governance/PolicyPacksController.SealedManifestGuard.cs");
        string findingUnmute = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Findings/FindingMuteController.Unmute.cs");
        string findingMuteGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Findings/FindingMuteController.SealedManifestGuard.cs");
        string pilotDeltas = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Pilots/PilotsController.Deltas.cs");
        string pilotGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Pilots/PilotsController.SealedManifestGuard.cs");
        string diagramIngest = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramIngestController.cs");
        string diagramIngestGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramIngestController.SealedManifestGuard.cs");
        string diagramReconcile = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramReconciliationController.cs");
        string diagramReconcileGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramReconciliationController.SealedManifestGuard.cs");
        string diagramVision = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramVisionIngestController.cs");
        string diagramVisionGuard = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramVisionIngestController.SealedManifestGuard.cs");
        string muteRepository = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Core/Persistence/ApplicationPorts/Interfaces/IFindingRecordMuteRepository.cs");

        policySimulate.Should().Contain("Simulate");
        policySimulate.Should().Contain("SimulateBulk");
        policySimulate.Should().Contain("MapPolicyPackSealedManifestConflict");
        policyGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        findingUnmute.Should().Contain("DeleteMuteAsync");
        findingUnmute.Should().Contain("EnsureFindingMuteRunSealedManifestAllowedAsync");
        findingMuteGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        muteRepository.Should().Contain("TryUnmuteAsync");
        pilotDeltas.Should().Contain("GetRecentDeltas");
        pilotDeltas.Should().Contain("EnsurePilotRecentDeltasSealedManifestReadAllowedAsync");
        pilotGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        diagramIngest.Should().Contain("Ingest");
        diagramIngest.Should().Contain("EnsureRunSealedManifestAllowedAsync");
        diagramIngestGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        diagramReconcile.Should().Contain("Reconcile");
        diagramReconcile.Should().Contain("GetReconciliation");
        diagramReconcile.Should().Contain("EnsureRunSealedManifestAllowedAsync");
        diagramReconcileGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
        diagramVision.Should().Contain("VisionIngest");
        diagramVision.Should().Contain("EnsureRunSealedManifestAllowedAsync");
        diagramVisionGuard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion904_906_unmute_consulting_and_run_package_blocked_reason_ui_wiring()
    {
        string findingUnmuteBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-unmute-mutation-blocked-reason.ts"));
        string findingUnmuteClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "finding-unmute-client.ts"));
        string findingsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "findings-api.ts"));
        string whitelabelButton = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "ReviewBoardWhitelabelConsultingExportButton.tsx"));
        string meetingPacket = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "reviews",
                "ReviewMeetingPacketButton.tsx"));
        string headerShare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "reviews",
                "ReviewHeaderShareMenu.tsx"));

        findingUnmuteBlocked.Should().Contain("findingUnmuteMutationBlockedReason");
        findingUnmuteClient.Should().Contain("findingUnmuteMutationBlockedReason");
        findingsApi.Should().Contain("deleteFindingMute");
        whitelabelButton.Should().Contain("consultingDocxMutationBlockedReason");
        meetingPacket.Should().Contain("runPackageExportMutationBlockedReason");
        headerShare.Should().Contain("runPackageExportMutationBlockedReason");
    }

    [Fact]
    public void Suggestion907_908_artifact_bundle_and_pilot_closeout_blocked_reason_wiring()
    {
        string artifactList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "ArtifactListTable.tsx"));
        string runActions = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "EmailRunToSponsorExportActions.tsx"));
        string closeoutBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "pilot-closeout-mutation-blocked-reason.ts"));
        string closeoutClient = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "pilots", "pilot-closeout-client.ts"));

        artifactList.Should().Contain("artifactBundleMutationBlockedReason");
        runActions.Should().Contain("artifactBundleMutationBlockedReason");
        closeoutBlocked.Should().Contain("pilotCloseoutMutationBlockedReason");
        closeoutClient.Should().Contain("pilotCloseoutMutationBlockedReason");
    }
}
