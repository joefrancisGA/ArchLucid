using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class SecurityEvidencePathGuardTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2");
    private static readonly Guid ProjectId = Guid.Parse("a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3");
    private static readonly Guid SnapshotId = Guid.Parse("a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4");

    [Fact]
    public void ValidateAndMaterialize_empty_hops_throws()
    {
        SecurityEvidencePathRecord header = CreateHeader(Guid.NewGuid(), DateTime.UtcNow);

        Action act = () => SecurityEvidencePathGuard.ValidateAndMaterialize(header, []);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*at least one hop*");
    }

    [Fact]
    public void ValidateAndMaterialize_ai_inference_with_confirmed_hop_throws()
    {
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = CreateHeader(pathId, utcNow);
        SecurityEvidencePathHopRecord hop = CreateHop(
            pathId,
            hopOrdinal: 1,
            provenance: ProvenanceKind.AiInference,
            band: PathConfidenceBand.Confirmed);

        Action act = () => SecurityEvidencePathGuard.ValidateAndMaterialize(header, [hop]);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AiInference*Confirmed*");
    }

    [Fact]
    public void ValidateAndMaterialize_weakest_link_uses_lowest_confidence_hop()
    {
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = CreateHeader(pathId, utcNow);
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, 1, ProvenanceKind.ObservedFact, PathConfidenceBand.Confirmed, edgeType: "role-assignment"),
            CreateHop(pathId, 2, ProvenanceKind.DerivedFact, PathConfidenceBand.Probable, edgeType: "network-reachability"),
        ];

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        validated.Path.PathConfidenceBand.Should().Be(PathConfidenceBand.Probable);
        validated.Path.WeakestHopOrdinal.Should().Be(2);
        validated.Path.WeakestHopReason.Should().Contain("Probable");
    }

    [Fact]
    public void ComputeWeakestLink_orders_confirmed_stronger_than_insufficient_evidence()
    {
        Guid pathId = Guid.NewGuid();
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, 1, ProvenanceKind.ObservedFact, PathConfidenceBand.InsufficientEvidence),
            CreateHop(pathId, 2, ProvenanceKind.ObservedFact, PathConfidenceBand.HighlyLikely),
        ];

        (PathConfidenceBand band, int ordinal, _) =
            SecurityEvidencePathGuard.ComputeWeakestLink(hops);

        band.Should().Be(PathConfidenceBand.InsufficientEvidence);
        ordinal.Should().Be(1);
    }

    private static SecurityEvidencePathRecord CreateHeader(Guid pathId, DateTime utcNow) =>
        new()
        {
            PathId = pathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static SecurityEvidencePathHopRecord CreateHop(
        Guid pathId,
        int hopOrdinal,
        ProvenanceKind provenance,
        PathConfidenceBand band,
        string edgeType = "test-edge") =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = hopOrdinal,
            FromNodeId = $"from-{hopOrdinal}",
            ToNodeId = $"to-{hopOrdinal}",
            EdgeType = edgeType,
            ProvenanceKind = provenance,
            HopConfidenceBand = band,
            EvidenceReference = $"/snapshots/{SnapshotId}/hop-{hopOrdinal}",
        };
}
