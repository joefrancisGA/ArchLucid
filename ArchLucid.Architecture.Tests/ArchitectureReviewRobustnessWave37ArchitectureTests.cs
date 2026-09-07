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
        string pairLoad = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsApplicationFacade.PairLoad.cs"));
        string results = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "CompareRunsResults.cs"));
        string agentsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunComparisonController.Agents.cs"));
        string e2eService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Analysis", "EndToEndReplayComparisonService.cs"));

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
        string reconciliationService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "DiagramInfrastructureReconciliationService.cs"));
        string reconciliationController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "ArchitectureDiagramReconciliationController.cs"));
        string visionController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "ArchitectureDiagramVisionIngestController.cs"));
        string inventoryController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "InfraEvidenceInventoryController.cs"));
        string narrativeService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "AzureInventoryDiffNarrativeService.cs"));

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
        string packsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Pilots", "PilotsController.Packs.cs"));

        packsController.Should().Contain("GetSponsorProofPackZip");
        packsController.Should().Contain("GetFirstValueReport");
        packsController.Should().Contain("PostSponsorOnePager");
        packsController.CountOccurrences("catch (ConflictException ex)").Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void Suggestion438_440_replay_warnings_roi_freshness_remediation_read_guard()
    {
        string manifestDiffComplexity = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Analysis",
                "ComparisonReplayPayloadComplexity.ManifestDiff.cs"));
        string sponsorEvidence = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "SponsorEvidencePackService.cs"));
        string remediationQuery = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceQueryService.cs"));
        string remediationController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "RemediationInstancesController.cs"));

        manifestDiffComplexity.Should().Contain("warning-only drift");
        sponsorEvidence.Should().Contain("ToResponseWithProofPackage");
        sponsorEvidence.Should().Contain("RoiCostEvidenceCollectionResolver");
        remediationQuery.Should().Contain("RemediationInstanceSealedManifestHashGuard");
        remediationController.Should().Contain("ConflictProblem");
    }
}

internal static class Wave37ArchitectureTestExtensions
{
    public static int CountOccurrences(this string source, string value)
    {
        int count = 0;
        int index = 0;

        while ((index = source.IndexOf(value, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += value.Length;
        }

        return count;
    }
}
