using System.Text.Json;

using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.SyntheticAzureWorlds;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowSyntheticAzureWorldMetamorphicTests
{
    private static readonly Guid TenantId = Guid.Parse("40000000-0000-4000-8000-000000000400");
    private static readonly Guid WorkspaceId = Guid.Parse("40000000-0000-4000-8000-000000000401");
    private static readonly Guid ProjectId = Guid.Parse("40000000-0000-4000-8000-000000000402");
    private static readonly Guid SnapshotId = Guid.Parse("40000000-0000-4000-8000-000000000403");

    [Fact]
    public void Ranking_is_invariant_to_path_input_order()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        SyntheticAzureWorld transformed = SyntheticAzureWorldMetamorphs.ReversePathInputOrder(baseline);

        RankOrder(baseline).Should().Equal(RankOrder(transformed));
        RankScores(baseline).Should().BeEquivalentTo(RankScores(transformed));
    }

    [Fact]
    public void Ranking_and_cut_points_are_invariant_to_evidence_reference_text()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.SharedManagedIdentityCutPoint();
        SyntheticAzureWorld transformed =
            SyntheticAzureWorldMetamorphs.RewriteEvidenceReferences(baseline, "metamorphic-copy");

        RankScores(baseline).Should().BeEquivalentTo(RankScores(transformed));
        CutPointShape(transformed).Should().Equal(CutPointShape(baseline));

        HashSet<string> baselineEvidence = Materialize(baseline)
            .SelectMany(item => item.Hops)
            .Select(hop => hop.EvidenceReference)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> transformedEvidence = Materialize(transformed)
            .SelectMany(item => item.Hops)
            .Select(hop => hop.EvidenceReference)
            .ToHashSet(StringComparer.Ordinal);

        transformedEvidence.Should().NotBeEquivalentTo(baselineEvidence,
            "evidence labels changed, while the security semantics did not");
    }

    [Fact]
    public void Adding_disconnected_low_leverage_path_does_not_change_existing_relative_ranking_or_primary_cut()
    {
        SyntheticAzureWorld baseline = SyntheticAzureWorldCatalog.SharedManagedIdentityCutPoint();
        SyntheticAzureWorld transformed = SyntheticAzureWorldMetamorphs.AddDisconnectedLowLeveragePath(baseline);

        IReadOnlyList<Guid> baselineOrder = RankOrder(baseline);
        IReadOnlyList<Guid> transformedOrder = RankOrder(transformed)
            .Where(baselineOrder.Contains)
            .ToList();

        transformedOrder.Should().Equal(baselineOrder);

        IReadOnlyList<string> baselineCuts = CutPointShape(baseline);
        IReadOnlyList<string> transformedCuts = CutPointShape(transformed);

        baselineCuts.Should().NotBeEmpty();
        transformedCuts.Should().NotBeEmpty();
        transformedCuts[0].Should().Be(baselineCuts[0]);
        transformedCuts[0].Should().Be($"node:{SyntheticAzureWorldCatalog.SharedManagedIdentityNode}");
    }

    [Fact]
    public void Json_round_trip_of_materialized_paths_preserves_rank_and_cut_semantics()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> baseline =
            Materialize(world);

        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> roundTripped = [];

        foreach ((SecurityEvidencePathRecord path, IReadOnlyList<SecurityEvidencePathHopRecord> hops) in baseline)
        {
            string pathJson = JsonSerializer.Serialize(path);
            string hopsJson = JsonSerializer.Serialize(hops);

            SecurityEvidencePathRecord restoredPath =
                JsonSerializer.Deserialize<SecurityEvidencePathRecord>(pathJson)
                ?? throw new InvalidOperationException("Path round-trip returned null.");
            List<SecurityEvidencePathHopRecord> restoredHops =
                JsonSerializer.Deserialize<List<SecurityEvidencePathHopRecord>>(hopsJson)
                ?? throw new InvalidOperationException("Hop round-trip returned null.");

            roundTripped.Add((restoredPath, restoredHops));
        }

        RankOrder(baseline).Should().Equal(RankOrder(roundTripped));
        RankScores(baseline).Should().BeEquivalentTo(RankScores(roundTripped));
        CutPointShape(baseline).Should().Equal(CutPointShape(roundTripped));
    }

    [Fact]
    public void Tenant_workspace_project_and_snapshot_identifiers_do_not_change_semantic_ranking()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.CrownJewelConsequence();

        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> first =
            world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> second =
            world.Materialize(
                Guid.Parse("50000000-0000-4000-8000-000000000500"),
                Guid.Parse("50000000-0000-4000-8000-000000000501"),
                Guid.Parse("50000000-0000-4000-8000-000000000502"),
                Guid.Parse("50000000-0000-4000-8000-000000000503"));

        HashSet<Guid> assertions = [SyntheticAzureWorldCatalog.CrownJewelAssertionId];

        RankOrder(first, assertions).Should().Equal(RankOrder(second, assertions));
        RankScores(first, assertions).Should().BeEquivalentTo(RankScores(second, assertions));
    }

    [Fact]
    public void Repeated_evaluation_is_deterministic()
    {
        SyntheticAzureWorld world = SyntheticAzureWorldCatalog.PublicExposureVsPrivateEndpoint();

        RankOrder(world).Should().Equal(RankOrder(world));
        RankScores(world).Should().BeEquivalentTo(RankScores(world));
        CutPointShape(world).Should().Equal(CutPointShape(world));
    }

    private static IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)>
        Materialize(SyntheticAzureWorld world) =>
        world.Materialize(TenantId, WorkspaceId, ProjectId, SnapshotId);

    private static IReadOnlyList<Guid> RankOrder(
        SyntheticAzureWorld world,
        IReadOnlySet<Guid>? activeAssertions = null) =>
        RankOrder(Materialize(world), activeAssertions);

    private static IReadOnlyList<Guid> RankOrder(
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths,
        IReadOnlySet<Guid>? activeAssertions = null) =>
        paths
            .Select(item => new
            {
                item.Path.PathId,
                Evaluation = SecurityEvidencePathRankCalculator.Evaluate(
                    item.Path,
                    item.Hops,
                    activeCrownJewelAssertionIds: activeAssertions),
            })
            .OrderByDescending(item => item.Evaluation.CompositeSortScore)
            .ThenByDescending(item => item.Evaluation.TechnicalExposureScore)
            .ThenByDescending(item => item.Evaluation.ConfidenceBandScore)
            .ThenBy(item => item.PathId)
            .Select(item => item.PathId)
            .ToList();

    private static IReadOnlyDictionary<Guid, decimal> RankScores(
        SyntheticAzureWorld world,
        IReadOnlySet<Guid>? activeAssertions = null) =>
        RankScores(Materialize(world), activeAssertions);

    private static IReadOnlyDictionary<Guid, decimal> RankScores(
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths,
        IReadOnlySet<Guid>? activeAssertions = null) =>
        paths.ToDictionary(
            item => item.Path.PathId,
            item => SecurityEvidencePathRankCalculator.Evaluate(
                    item.Path,
                    item.Hops,
                    activeCrownJewelAssertionIds: activeAssertions)
                .CompositeSortScore);

    private static IReadOnlyList<string> CutPointShape(SyntheticAzureWorld world) =>
        CutPointShape(Materialize(world));

    private static IReadOnlyList<string> CutPointShape(
        IReadOnlyList<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths) =>
        SecurityEvidenceCutPointAnalyzer.Analyze(paths, new Dictionary<Guid, string?>())
            .Select(candidate =>
                $"{candidate.CutKey}|{candidate.CollapsedPathIds.Count}|{candidate.OperationalCostClass}")
            .ToList();
}
