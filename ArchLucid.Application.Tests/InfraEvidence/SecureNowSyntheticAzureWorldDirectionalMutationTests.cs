using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowSyntheticAzureWorldDirectionalMutationTests
{
    private static readonly Guid TenantId = Guid.Parse("42000000-0000-4000-8000-000000000400");
    private static readonly Guid WorkspaceId = Guid.Parse("42000000-0000-4000-8000-000000000401");
    private static readonly Guid ProjectId = Guid.Parse("42000000-0000-4000-8000-000000000402");
    private static readonly Guid SnapshotId = Guid.Parse("42000000-0000-4000-8000-000000000403");

    [Fact]
    public void Adding_public_ingress_does_not_improve_exposure_or_rank_below_private_baseline()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        SyntheticAzurePath privatePath = baseline.Paths.Single(path => path.PathId == SyntheticAzureWorldCatalog.PrivatePathId);
        SyntheticAzurePath mutatedPath =
            SyntheticAzureWorldDirectionalMutations.AddPublicIngress(privatePath);

        (SecurityEvidencePathRecord baselineRecord, IReadOnlyList<SecurityEvidencePathHopRecord> baselineHops) =
            MaterializePath(privatePath, baseline.Name);
        (SecurityEvidencePathRecord mutatedRecord, IReadOnlyList<SecurityEvidencePathHopRecord> mutatedHops) =
            MaterializePath(mutatedPath, $"{baseline.Name}-public-ingress");

        SecurityEvidencePathRankEvaluation baselineEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(baselineRecord, baselineHops);
        SecurityEvidencePathRankEvaluation mutatedEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(mutatedRecord, mutatedHops);

        mutatedEvaluation.TechnicalExposureScore.Should().BeGreaterThanOrEqualTo(
            baselineEvaluation.TechnicalExposureScore);
        mutatedEvaluation.CompositeSortScore.Should().BeGreaterThanOrEqualTo(
            baselineEvaluation.CompositeSortScore);
    }

    [Fact]
    public void Adding_private_endpoint_route_does_not_cancel_public_exposure()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        SyntheticAzurePath publicPath = baseline.Paths.Single(path => path.PathId == SyntheticAzureWorldCatalog.PublicPathId);
        SyntheticAzurePath mutatedPath =
            SyntheticAzureWorldDirectionalMutations.AddPrivateEndpointRoute(publicPath);

        (SecurityEvidencePathRecord baselineRecord, IReadOnlyList<SecurityEvidencePathHopRecord> baselineHops) =
            MaterializePath(publicPath, baseline.Name);
        (SecurityEvidencePathRecord mutatedRecord, IReadOnlyList<SecurityEvidencePathHopRecord> mutatedHops) =
            MaterializePath(mutatedPath, $"{baseline.Name}-private-route");

        SecurityEvidencePathRankEvaluation baselineEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(baselineRecord, baselineHops);
        SecurityEvidencePathRankEvaluation mutatedEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(mutatedRecord, mutatedHops);

        mutatedEvaluation.TechnicalExposureScore.Should().BeGreaterThanOrEqualTo(
            baselineEvaluation.TechnicalExposureScore);
    }

    [Fact]
    public void Removing_public_exposure_does_not_worsen_exposure()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        SyntheticAzurePath publicPath = baseline.Paths.Single(path => path.PathId == SyntheticAzureWorldCatalog.PublicPathId);
        SyntheticAzurePath mutatedPath =
            SyntheticAzureWorldDirectionalMutations.RemovePublicExposure(publicPath);

        (SecurityEvidencePathRecord baselineRecord, IReadOnlyList<SecurityEvidencePathHopRecord> baselineHops) =
            MaterializePath(publicPath, baseline.Name);
        (SecurityEvidencePathRecord mutatedRecord, IReadOnlyList<SecurityEvidencePathHopRecord> mutatedHops) =
            MaterializePath(mutatedPath, $"{baseline.Name}-public-removed");

        SecurityEvidencePathRankEvaluation baselineEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(baselineRecord, baselineHops);
        SecurityEvidencePathRankEvaluation mutatedEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(mutatedRecord, mutatedHops);

        mutatedEvaluation.TechnicalExposureScore.Should().BeLessThanOrEqualTo(
            baselineEvaluation.TechnicalExposureScore);
    }

    [Fact]
    public void Write_privilege_does_not_rank_as_weaker_than_read_privilege()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.CrownJewelConsequence();
        SyntheticAzurePath writePath = baseline.Paths.Single(path => path.PathId == SyntheticAzureWorldCatalog.CrownJewelPathId);
        SyntheticAzurePath readPath =
            SyntheticAzureWorldDirectionalMutations.WithActionEdge(writePath, GraphEdgeTypes.CanRead);

        (SecurityEvidencePathRecord writeRecord, IReadOnlyList<SecurityEvidencePathHopRecord> writeHops) =
            MaterializePath(writePath, baseline.Name);
        (SecurityEvidencePathRecord readRecord, IReadOnlyList<SecurityEvidencePathHopRecord> readHops) =
            MaterializePath(readPath, $"{baseline.Name}-read");

        SecurityEvidencePathRankEvaluation writeEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(writeRecord, writeHops);
        SecurityEvidencePathRankEvaluation readEvaluation =
            SecurityEvidencePathRankCalculator.Evaluate(readRecord, readHops);

        writeEvaluation.PrivilegeDepthScore.Should().BeGreaterThanOrEqualTo(
            readEvaluation.PrivilegeDepthScore);
    }

    [Fact]
    public void Removing_shared_identity_from_two_paths_reduces_its_cut()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.SharedManagedIdentityCutPoint();
        SyntheticAzureWorld mutated =
            SyntheticAzureWorldDirectionalMutations.ReplaceSharedIdentityOnTwoPaths(baseline);

        int baselineCollapsed = CollapsedPathCount(baseline, $"node:{SyntheticAzureWorldCatalog.SharedManagedIdentityNode}");
        int mutatedCollapsed = CollapsedPathCount(mutated, $"node:{SyntheticAzureWorldCatalog.SharedManagedIdentityNode}");

        baselineCollapsed.Should().Be(3);
        mutatedCollapsed.Should().Be(1);
        mutatedCollapsed.Should().BeLessThan(baselineCollapsed);
    }

    private static (SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)
        MaterializePath(SyntheticAzurePath source, string worldName)
    {
        SyntheticAzureWorld world = new()
        {
            Name = worldName,
            Paths = [source],
        };

        return world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId).Single();
    }

    private static int CollapsedPathCount(SyntheticAzureWorld world, string cutKey)
    {
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

        return SecurityEvidenceCutPointAnalyzer
            .Analyze(paths, new Dictionary<Guid, string?>())
            .Single(candidate => candidate.CutKey == cutKey)
            .CollapsedPathIds
            .Count;
    }
}
