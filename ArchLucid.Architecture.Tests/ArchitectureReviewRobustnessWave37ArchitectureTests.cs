using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-37 architecture create/review robustness suggestions 429–440.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave37ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion429_430_compare_pair_lifecycle_and_409_mapping()
    {
        string pairLoad = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsApplicationFacade.PairLoad.cs");
        string results = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/CompareRunsResults.cs");
        string agentsController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Authority/RunComparisonController.Agents.cs");
        string e2eService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/EndToEndReplayComparisonService.cs");

        pairLoad.Should().Contain("TryEnsureCompletePair");
        results.Should().Contain("LeftLifecycleIncomplete");
        results.Should().Contain("RightLifecycleIncomplete");
        agentsController.Should().Contain("LeftLifecycleIncomplete");
        agentsController.Should().Contain("ConflictProblem");
        e2eService.Should().Contain("LeftLifecycleIncomplete");
    }

    [Fact]
    public void Suggestion431_434_infra_diagram_drift_guards_and_409()
    {
        string reconciliationService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/DiagramInfrastructureReconciliationService.cs");
        string reconciliationController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramReconciliationController.cs");
        string visionController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramVisionIngestController.cs");
        string inventoryController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceInventoryController.cs");
        string narrativeService = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/AzureInventoryDiffNarrativeService.cs");

        reconciliationService.Should().Contain("DiagramInfrastructureReconciliationSealedManifestHashGuard");
        reconciliationController.Should().Contain("GetReconciliation");
        reconciliationController.Should().Contain("ConflictProblem");
        visionController.Should().Contain("ConflictException");
        inventoryController.Should().Contain("BuildNarrative");
        narrativeService.Should().Contain("catch (ConflictException)");
    }

    [Fact]
    public void Suggestion435_437_pilot_pack_409_mapping()
    {
        string packsController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/Pilots/PilotsController.Packs.cs");

        packsController.Should().Contain("GetSponsorProofPackZip");
        packsController.Should().Contain("GetFirstValueReport");
        packsController.Should().Contain("PostSponsorOnePager");
        packsController.CountOccurrences("catch (ConflictException ex)").Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void Suggestion438_440_replay_warnings_roi_freshness_remediation_read_guard()
    {
        string manifestDiffComplexity = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Analysis/ComparisonReplayPayloadComplexity.ManifestDiff.cs");
        string sponsorEvidence = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Pilots/SponsorEvidencePackService.cs");
        string remediationQuery = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceQueryService.cs");
        string remediationController = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Api/Controllers/InfraEvidence/RemediationInstancesController.cs");

        manifestDiffComplexity.Should().Contain("warning-only drift");
        sponsorEvidence.Should().Contain("ToResponseWithProofPackage");
        sponsorEvidence.Should().Contain("RoiCostEvidenceCollectionResolver");
        remediationQuery.Should().Contain("RemediationInstanceSealedManifestHashGuard");
        remediationController.Should().Contain("ConflictProblem");
    }
}
