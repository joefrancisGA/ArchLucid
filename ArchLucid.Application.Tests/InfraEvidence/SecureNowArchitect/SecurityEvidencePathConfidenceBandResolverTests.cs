using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathConfidenceBandResolverTests
{
    [Fact]
    public void ResolveWeakestHopBand_returns_insufficient_when_any_hop_is_insufficient()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            Hop(PathConfidenceBand.Confirmed),
            Hop(PathConfidenceBand.HighlyLikely),
            Hop(PathConfidenceBand.InsufficientEvidence),
        ];

        SecurityEvidencePathConfidenceBandResolver.ResolveWeakestHopBand(hops)
            .Should().Be(PathConfidenceBand.InsufficientEvidence);
    }

    [Fact]
    public void ResolveWeakestHopBand_returns_confirmed_when_all_hops_are_confirmed()
    {
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            Hop(PathConfidenceBand.Confirmed),
            Hop(PathConfidenceBand.Confirmed),
        ];

        SecurityEvidencePathConfidenceBandResolver.ResolveWeakestHopBand(hops)
            .Should().Be(PathConfidenceBand.Confirmed);
    }

    private static SecurityEvidencePathHopRecord Hop(PathConfidenceBand band) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            HopOrdinal = 1,
            FromNodeId = "a",
            ToNodeId = "b",
            EdgeType = "TEST",
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = band,
        };
}
