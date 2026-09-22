using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathRankCalculatorTests
{
    private static readonly Guid SnapshotId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid TenantId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid PathIdA = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid PathIdB = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid LowPathId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
    private static readonly Guid CrownJewelAssertionId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");

    [Fact]
    public void Evaluate_identical_technical_paths_without_phi_assertion_do_not_collapse_to_last()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> publicOwnerHops = BuildPublicOwnerHops(PathIdA);

        SecurityEvidencePathRecord withAssertion = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            CrownJewelAssertionId,
            publicOwnerHops);

        SecurityEvidencePathRecord withoutAssertion = BuildPath(
            PathIdB,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            crownJewelAssertionId: null,
            publicOwnerHops);

        SecurityEvidencePathRecord lowTechnicalPath = BuildPath(
            LowPathId,
            PathKind.Privilege,
            PathConfidenceBand.Possible,
            crownJewelAssertionId: null,
            hops: BuildInternalReadOnlyHops(LowPathId));

        SecurityEvidencePathRankEvaluation withRank =
            SecurityEvidencePathRankCalculator.Evaluate(withAssertion, publicOwnerHops);
        SecurityEvidencePathRankEvaluation withoutRank =
            SecurityEvidencePathRankCalculator.Evaluate(withoutAssertion, publicOwnerHops);
        SecurityEvidencePathRankEvaluation lowRank =
            SecurityEvidencePathRankCalculator.Evaluate(lowTechnicalPath, BuildInternalReadOnlyHops(LowPathId));

        withoutRank.TechnicalExposureScore.Should().Be(withRank.TechnicalExposureScore);
        withoutRank.BusinessConsequenceScore.Should().BeNull();
        withRank.BusinessConsequenceScore.Should().NotBeNull();

        List<(Guid PathId, decimal CompositeSortScore)> ordered = new[]
            {
                (PathIdA, withRank.CompositeSortScore),
                (PathIdB, withoutRank.CompositeSortScore),
                (LowPathId, lowRank.CompositeSortScore),
            }
            .OrderByDescending(item => item.CompositeSortScore)
            .ToList();

        ordered[2].PathId.Should().Be(LowPathId);
        ordered.Take(2).Select(item => item.PathId).Should().Contain(new[] { PathIdA, PathIdB });
        withoutRank.CompositeSortScore.Should().BeGreaterThan(lowRank.CompositeSortScore);
    }

    [Fact]
    public void Evaluate_confirmed_public_owner_outranks_possible_missing_tag_combination()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> publicOwnerHops = BuildPublicOwnerHops(PathIdA);
        IReadOnlyList<SecurityEvidencePathHopRecord> internalHops = BuildInternalReadOnlyHops(PathIdB);

        SecurityEvidencePathRecord confirmedPublicOwner = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            crownJewelAssertionId: null,
            publicOwnerHops);

        SecurityEvidencePathRecord possibleInternal = BuildPath(
            PathIdB,
            PathKind.Privilege,
            PathConfidenceBand.Possible,
            crownJewelAssertionId: null,
            internalHops);

        SecurityEvidencePathRankEvaluation confirmedRank =
            SecurityEvidencePathRankCalculator.Evaluate(confirmedPublicOwner, publicOwnerHops);
        SecurityEvidencePathRankEvaluation possibleRank =
            SecurityEvidencePathRankCalculator.Evaluate(possibleInternal, internalHops);

        confirmedRank.CompositeSortScore.Should().BeGreaterThan(possibleRank.CompositeSortScore);
        confirmedRank.TechnicalExposureScore.Should().BeGreaterThan(possibleRank.TechnicalExposureScore);
        confirmedRank.ConfidenceBandScore.Should().BeGreaterThan(possibleRank.ConfidenceBandScore);
    }

    [Fact]
    public void Evaluate_tenant_weights_change_rank_order()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> highTechnicalHops = BuildPublicOwnerHops(PathIdA);
        IReadOnlyList<SecurityEvidencePathHopRecord> moderateHops = BuildInternalReadOnlyHops(PathIdB);

        SecurityEvidencePathRecord highTechnical = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            crownJewelAssertionId: null,
            highTechnicalHops);

        SecurityEvidencePathRecord assertedModerate = BuildPath(
            PathIdB,
            PathKind.Privilege,
            PathConfidenceBand.Probable,
            CrownJewelAssertionId,
            moderateHops);

        SecurityEvidencePathRankEvaluation defaultHigh =
            SecurityEvidencePathRankCalculator.Evaluate(highTechnical, highTechnicalHops);
        SecurityEvidencePathRankEvaluation defaultModerate =
            SecurityEvidencePathRankCalculator.Evaluate(assertedModerate, moderateHops);

        defaultHigh.CompositeSortScore.Should().BeGreaterThan(defaultModerate.CompositeSortScore);

        IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> consequenceHeavyWeights =
            new Dictionary<SecurityEvidencePathRankDimension, decimal>
            {
                [SecurityEvidencePathRankDimension.TechnicalExposure] = 0.05m,
                [SecurityEvidencePathRankDimension.PrivilegeDepth] = 0.05m,
                [SecurityEvidencePathRankDimension.BlastRadius] = 0.05m,
                [SecurityEvidencePathRankDimension.BusinessConsequence] = 0.75m,
                [SecurityEvidencePathRankDimension.ConfidenceBand] = 0.10m,
            };

        SecurityEvidencePathRankEvaluation weightedHigh =
            SecurityEvidencePathRankCalculator.Evaluate(highTechnical, highTechnicalHops, consequenceHeavyWeights);
        SecurityEvidencePathRankEvaluation weightedModerate =
            SecurityEvidencePathRankCalculator.Evaluate(assertedModerate, moderateHops, consequenceHeavyWeights);

        weightedModerate.CompositeSortScore.Should().BeGreaterThan(weightedHigh.CompositeSortScore);
    }

    [Fact]
    public void Evaluate_expired_crown_jewel_assertion_falls_back_to_unknown_consequence()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> publicOwnerHops = BuildPublicOwnerHops(PathIdA);

        SecurityEvidencePathRecord withExpiredAssertion = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            CrownJewelAssertionId,
            publicOwnerHops);

        HashSet<Guid> activeAssertionIds = [];

        SecurityEvidencePathRankEvaluation activeRank =
            SecurityEvidencePathRankCalculator.Evaluate(withExpiredAssertion, publicOwnerHops);

        SecurityEvidencePathRankEvaluation expiredRank =
            SecurityEvidencePathRankCalculator.Evaluate(
                withExpiredAssertion,
                publicOwnerHops,
                activeCrownJewelAssertionIds: activeAssertionIds);

        activeRank.BusinessConsequenceScore.Should().NotBeNull();
        expiredRank.BusinessConsequenceScore.Should().BeNull();
    }

    [Fact]
    public void Evaluate_unknown_consequence_uses_neutral_score_in_composite_not_zero()
    {
        SecurityEvidencePathRecord path = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            crownJewelAssertionId: null,
            BuildPublicOwnerHops(PathIdA));

        SecurityEvidencePathRankEvaluation evaluation =
            SecurityEvidencePathRankCalculator.Evaluate(path, BuildPublicOwnerHops(PathIdA));

        evaluation.BusinessConsequenceScore.Should().BeNull();

        SecurityEvidencePathRankDimensionContribution consequenceContribution = evaluation.Contributions
            .Should()
            .ContainSingle(item => item.Dimension == SecurityEvidencePathRankDimension.BusinessConsequence)
            .Subject;

        consequenceContribution.RawScore.Should().Be(SecurityEvidencePathRankConstants.NeutralBusinessConsequenceScore);
        consequenceContribution.WeightedContribution.Should().BeGreaterThan(0m);
        evaluation.CompositeSortScore.Should().BeGreaterThan(0m);
    }

    [Fact]
    public void Evaluate_low_defender_posture_increases_blast_radius_without_changing_technical_exposure()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> publicOwnerHops = BuildPublicOwnerHops(PathIdA);

        SecurityEvidencePathRecord path = BuildPath(
            PathIdA,
            PathKind.ToxicCombination,
            PathConfidenceBand.Confirmed,
            crownJewelAssertionId: null,
            publicOwnerHops);

        SecurityEvidencePathRankEvaluation withoutPosture =
            SecurityEvidencePathRankCalculator.Evaluate(path, publicOwnerHops);

        SecurityEvidencePathRankEvaluation withLowPosture =
            SecurityEvidencePathRankCalculator.Evaluate(
                path,
                publicOwnerHops,
                subscriptionDefenderBand: DefenderSecureScoreOrdinalBand.Low);

        withLowPosture.BlastRadiusScore.Should().BeGreaterThan(withoutPosture.BlastRadiusScore);
        withLowPosture.TechnicalExposureScore.Should().Be(withoutPosture.TechnicalExposureScore);
        withLowPosture.CompositeSortScore.Should().BeGreaterThan(withoutPosture.CompositeSortScore);

        SecurityEvidencePathRankDimensionContribution blastContribution = withLowPosture.Contributions
            .Should()
            .ContainSingle(item => item.Dimension == SecurityEvidencePathRankDimension.BlastRadius)
            .Subject;

        blastContribution.Source.Should().Contain("defender-posture-low");
    }

    private static SecurityEvidencePathRecord BuildPath(
        Guid pathId,
        PathKind pathKind,
        PathConfidenceBand confidenceBand,
        Guid? crownJewelAssertionId,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = new()
        {
            PathId = pathId,
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = SnapshotId,
            PathKind = pathKind,
            PathConfidenceBand = confidenceBand,
            CrownJewelAssertionId = crownJewelAssertionId,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        return validated.Path;
    }

    private static IReadOnlyList<SecurityEvidencePathHopRecord> BuildPublicOwnerHops(Guid pathId) =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
            ToNodeId = "resource:storage/sa1",
            EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:public",
        },
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 2,
            FromNodeId = "principal:owner-user",
            ToNodeId = "resource:storage/sa1",
            EdgeType = GraphEdgeTypes.CanWrite,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:owner",
        },
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 3,
            FromNodeId = "resource:storage/sa1",
            ToNodeId = SecureNowArchitectConstants.InternetEgressNodeId,
            EdgeType = SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = "test:egress",
        },
    ];

    private static IReadOnlyList<SecurityEvidencePathHopRecord> BuildInternalReadOnlyHops(Guid pathId) =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = "principal:internal-user",
            ToNodeId = "resource:storage/sa2",
            EdgeType = GraphEdgeTypes.CanRead,
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            HopConfidenceBand = PathConfidenceBand.Possible,
            InferenceSource = "missing-tag",
            EvidenceReference = "test:internal-read",
        },
    ];
}
