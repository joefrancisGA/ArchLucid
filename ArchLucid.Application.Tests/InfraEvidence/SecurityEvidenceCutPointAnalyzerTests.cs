using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidenceCutPointAnalyzerTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid SnapshotId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid Path1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Path2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Path3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private const string SharedIdentityNode = "identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker";

    [Fact]
    public void Analyze_three_paths_sharing_managed_identity_outranks_disjoint_public_ips()
    {
        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> rankedPaths =
        [
            BuildPath(Path1, BuildIdentityHop(Path1, SharedIdentityNode, "public-ip-1")),
            BuildPath(Path2, BuildIdentityHop(Path2, SharedIdentityNode, "public-ip-2")),
            BuildPath(Path3, BuildIdentityHop(Path3, SharedIdentityNode, "public-ip-3")),
        ];

        IReadOnlyList<SecurityEvidenceCutPointCandidate> results =
            SecurityEvidenceCutPointAnalyzer.Analyze(rankedPaths, new Dictionary<Guid, string?>());

        SecurityEvidenceCutPointCandidate sharedIdentity = results
            .Should()
            .Contain(candidate =>
                candidate.CutKind == SecurityEvidenceCutPointKind.Node
                && candidate.FromNodeId == SharedIdentityNode)
            .Subject;

        sharedIdentity.CollapsedPathIds.Should().HaveCount(3);
        sharedIdentity.OperationalCostClass.Should().Be(SecurityEvidenceCutPointOperationalCostClass.RoleAssignment);

        IEnumerable<SecurityEvidenceCutPointCandidate> publicIpNodes = results
            .Where(candidate =>
                candidate.CutKind == SecurityEvidenceCutPointKind.Node
                && candidate.FromNodeId is not null
                && candidate.FromNodeId.Contains("public-ip", StringComparison.OrdinalIgnoreCase));

        foreach (SecurityEvidenceCutPointCandidate publicIpNode in publicIpNodes)
        {
            publicIpNode.CollapsedPathIds.Should().ContainSingle();
        }

        decimal sharedLeverage = SecurityEvidenceCutPointConstants.ComputeLeverageScore(
            sharedIdentity.CollapsedPathIds.Count,
            sharedIdentity.OperationalCostClass);
        decimal publicLeverage = SecurityEvidenceCutPointConstants.ComputeLeverageScore(
            publicIpNodes.First().CollapsedPathIds.Count,
            publicIpNodes.First().OperationalCostClass);

        sharedLeverage.Should().BeGreaterThan(publicLeverage);
        results[0].CutKey.Should().Be(sharedIdentity.CutKey);
    }

    [Fact]
    public void ComputeLeverageScore_cheaper_cost_class_wins_tie_on_paths_collapsed()
    {
        decimal roleLeverage = SecurityEvidenceCutPointConstants.ComputeLeverageScore(
            3,
            SecurityEvidenceCutPointOperationalCostClass.RoleAssignment);
        decimal publicLeverage = SecurityEvidenceCutPointConstants.ComputeLeverageScore(
            3,
            SecurityEvidenceCutPointOperationalCostClass.PublicAccessProperty);

        publicLeverage.Should().BeGreaterThan(roleLeverage);
    }

    [Fact]
    public void Analyze_empty_ranked_paths_returns_empty_without_throw()
    {
        IReadOnlyList<SecurityEvidenceCutPointCandidate> results =
            SecurityEvidenceCutPointAnalyzer.Analyze([], new Dictionary<Guid, string?>());

        results.Should().BeEmpty();
    }

    [Fact]
    public void ToRecord_bounds_long_edge_keys_and_retains_full_endpoints()
    {
        string from = new('a', 400);
        string to = new('b', 400);
        string otherTo = to[..^1] + "c";
        var candidates = SecurityEvidenceCutPointAnalyzer.Analyze(
            [BuildPath(Path1, BuildIdentityHop(Path1, from, to)),
             BuildPath(Path2, BuildIdentityHop(Path2, from, otherTo))],
            new Dictionary<Guid, string?>());
        var first = candidates.Single(item => item.FromNodeId == from && item.ToNodeId == to);
        var second = candidates.Single(item => item.FromNodeId == from && item.ToNodeId == otherTo);

        var firstRecord = SecurityEvidenceCutPointAnalyzer.ToRecord(first, TenantId, SnapshotId, 1, DateTime.UnixEpoch, null);
        var secondRecord = SecurityEvidenceCutPointAnalyzer.ToRecord(second, TenantId, SnapshotId, 2, DateTime.UnixEpoch, null);
        var repeated = SecurityEvidenceCutPointAnalyzer.ToRecord(first, TenantId, SnapshotId, 3, DateTime.UnixEpoch, null);

        firstRecord.CutKey.Length.Should().BeLessThanOrEqualTo(768);
        firstRecord.CutKey.Should().Be(repeated.CutKey).And.NotBe(secondRecord.CutKey);
        firstRecord.FromNodeId.Should().Be(from);
        firstRecord.ToNodeId.Should().Be(to);
    }

    [Fact]
    public void ToRecord_preserves_a_cut_key_at_the_sql_limit()
    {
        var candidate = new SecurityEvidenceCutPointCandidate { CutKey = "edge:" + new string('a', 763) };
        var record = SecurityEvidenceCutPointAnalyzer.ToRecord(candidate, TenantId, SnapshotId, 1, DateTime.UnixEpoch, null);

        record.CutKey.Should().Be(candidate.CutKey);
    }

    private static (SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops) BuildPath(
        Guid pathId,
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
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        return (validated.Path, validated.Hops.ToList());
    }

    private static IReadOnlyList<SecurityEvidencePathHopRecord> BuildIdentityHop(
        Guid pathId,
        string identityNodeId,
        string publicIpNodeId) =>
    [
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = identityNodeId,
            ToNodeId = publicIpNodeId,
            EdgeType = GraphEdgeTypes.UsesIdentity,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = $"test:{pathId:N}",
        },
        new SecurityEvidencePathHopRecord
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 2,
            FromNodeId = publicIpNodeId,
            ToNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
            EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = $"test-public:{pathId:N}",
        },
    ];
}
