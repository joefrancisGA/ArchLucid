using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowSyntheticAzureWorldTests
{
    private static readonly Guid TenantId = Guid.Parse("30000000-0000-4000-8000-000000000300");
    private static readonly Guid WorkspaceId = Guid.Parse("30000000-0000-4000-8000-000000000301");
    private static readonly Guid ProjectId = Guid.Parse("30000000-0000-4000-8000-000000000302");
    private static readonly Guid SnapshotId = Guid.Parse("30000000-0000-4000-8000-000000000303");

    [Fact]
    public void Public_exposure_world_ranks_public_route_above_private_endpoint_route()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> actual =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

        IReadOnlyList<Guid> actualOrder = actual
            .Select(item => new
            {
                item.Path.PathId,
                Evaluation = SecurityEvidencePathRankCalculator.Evaluate(item.Path, item.Hops),
            })
            .OrderByDescending(item => item.Evaluation.CompositeSortScore)
            .ThenByDescending(item => item.Evaluation.TechnicalExposureScore)
            .ThenByDescending(item => item.Evaluation.ConfidenceBandScore)
            .ThenBy(item => item.PathId)
            .Select(item => item.PathId)
            .ToList();

        actualOrder.Should().Equal(world.ExpectedRankOrder);
    }

    [Fact]
    public void Shared_managed_identity_world_identifies_identity_as_highest_leverage_cut_point()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.SharedManagedIdentityCutPoint();
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> actual =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

        IReadOnlyList<SecurityEvidenceCutPointCandidate> cutPoints =
            SecurityEvidenceCutPointAnalyzer.Analyze(actual, new Dictionary<Guid, string?>());

        cutPoints.Should().NotBeEmpty();
        cutPoints[0].CutKey.Should().Be(world.ExpectedTopCutKey);
        cutPoints[0].CollapsedPathIds.Should().HaveCount(world.ExpectedTopCutCollapsedPathCount!.Value);
    }

    [Fact]
    public void Crown_jewel_world_ranks_asserted_business_consequence_above_unknown_consequence()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.CrownJewelConsequence();
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> actual =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

        HashSet<Guid> activeAssertions = [SyntheticAzureWorldCatalog.CrownJewelAssertionId];

        IReadOnlyList<Guid> actualOrder = actual
            .Select(item => new
            {
                item.Path.PathId,
                Evaluation = SecurityEvidencePathRankCalculator.Evaluate(
                    item.Path,
                    item.Hops,
                    activeCrownJewelAssertionIds: activeAssertions),
            })
            .OrderByDescending(item => item.Evaluation.CompositeSortScore)
            .ThenBy(item => item.PathId)
            .Select(item => item.PathId)
            .ToList();

        actualOrder.Should().Equal(world.ExpectedRankOrder);

        SecurityEvidencePathRankEvaluation ordinary = SecurityEvidencePathRankCalculator.Evaluate(
            actual.Single(item => item.Path.PathId == SyntheticAzureWorldCatalog.PrivatePathId).Path,
            actual.Single(item => item.Path.PathId == SyntheticAzureWorldCatalog.PrivatePathId).Hops,
            activeCrownJewelAssertionIds: activeAssertions);

        ordinary.BusinessConsequenceScore.Should().BeNull(
            "unknown business consequence must stay unknown rather than being converted into false zero certainty");
        ordinary.CompositeSortScore.Should().BeGreaterThan(0m,
            "unknown consequence must not collapse a technically real path");
    }

    [Fact]
    public void Insufficient_evidence_world_preserves_uncertainty_and_does_not_promote_it_to_observed_fact()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.InsufficientEvidenceMustStayWeakest();
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> actual =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

        SecurityEvidencePathRecord path = actual.Single().Path;
        SecurityEvidencePathHopRecord hop = actual.Single().Hops.Single();

        path.PathConfidenceBand.Should().Be(PathConfidenceBand.InsufficientEvidence);
        hop.HopConfidenceBand.Should().Be(PathConfidenceBand.InsufficientEvidence);
        hop.ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
        hop.ProvenanceKind.Should().NotBe(ProvenanceKind.ObservedFact);
    }

    [Fact]
    public void Synthetic_worlds_preserve_manually_declared_evidence_references()
    {
        SyntheticAzureWorld[] worlds =
        [
            SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint(),
            SyntheticAzureWorldCatalog.SharedManagedIdentityCutPoint(),
            SyntheticAzureWorldCatalog.InsufficientEvidenceMustStayWeakest(),
        ];

        foreach (SyntheticAzureWorld world in worlds)
        {
            IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> actual =
                world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

            HashSet<string> actualEvidence = actual
                .SelectMany(item => item.Hops)
                .Select(hop => hop.EvidenceReference)
                .ToHashSet(StringComparer.Ordinal);

            foreach (string expectedEvidence in world.RequiredEvidenceReferences)
            {
                actualEvidence.Should().Contain(expectedEvidence);
            }
        }
    }
}
