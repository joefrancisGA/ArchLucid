using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

public static class SecurityEvidencePathGuard
{
    public sealed record ValidatedPath(
        SecurityEvidencePathRecord Path,
        IReadOnlyList<SecurityEvidencePathHopRecord> Hops);

    public static ValidatedPath ValidateAndMaterialize(
        SecurityEvidencePathRecord pathHeader,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(pathHeader);
        ArgumentNullException.ThrowIfNull(hops);

        if (hops.Count == 0)
        {
            throw new InvalidOperationException("Security evidence paths require at least one hop.");
        }

        List<SecurityEvidencePathHopRecord> orderedHops = hops
            .OrderBy(static hop => hop.HopOrdinal)
            .ToList();

        foreach (SecurityEvidencePathHopRecord hop in orderedHops)
        {
            if (string.IsNullOrWhiteSpace(hop.FromNodeId))
            {
                throw new InvalidOperationException("Each hop requires FromNodeId.");
            }

            if (string.IsNullOrWhiteSpace(hop.ToNodeId))
            {
                throw new InvalidOperationException("Each hop requires ToNodeId.");
            }

            if (string.IsNullOrWhiteSpace(hop.EdgeType))
            {
                throw new InvalidOperationException("Each hop requires EdgeType.");
            }

            if (string.IsNullOrWhiteSpace(hop.EvidenceReference))
            {
                throw new InvalidOperationException("Each hop requires EvidenceReference.");
            }

            if (hop.ProvenanceKind == ProvenanceKind.AiInference
                && hop.HopConfidenceBand == PathConfidenceBand.Confirmed)
            {
                throw new InvalidOperationException("AiInference hops cannot use Confirmed confidence.");
            }
        }

        (PathConfidenceBand pathBand, int weakestOrdinal, string weakestReason) = ComputeWeakestLink(orderedHops);
        byte[] canonicalHash = SecurityEvidencePathCanonicalHash.ComputeSha256(orderedHops);

        SecurityEvidencePathRecord materialized = new()
        {
            PathId = pathHeader.PathId,
            TenantId = pathHeader.TenantId,
            WorkspaceId = pathHeader.WorkspaceId,
            ProjectId = pathHeader.ProjectId,
            SnapshotId = pathHeader.SnapshotId,
            PathKind = pathHeader.PathKind,
            PathConfidenceBand = pathBand,
            CanonicalHopHashSha256 = canonicalHash,
            WeakestHopOrdinal = weakestOrdinal,
            WeakestHopReason = weakestReason,
            CrownJewelAssertionId = pathHeader.CrownJewelAssertionId,
            CreatedUtc = pathHeader.CreatedUtc,
            UpdatedUtc = pathHeader.UpdatedUtc,
        };

        return new ValidatedPath(materialized, orderedHops);
    }

    public static (PathConfidenceBand Band, int WeakestHopOrdinal, string WeakestHopReason) ComputeWeakestLink(
        IReadOnlyList<SecurityEvidencePathHopRecord> orderedHops)
    {
        ArgumentNullException.ThrowIfNull(orderedHops);

        if (orderedHops.Count == 0)
        {
            throw new InvalidOperationException("At least one hop is required.");
        }

        SecurityEvidencePathHopRecord weakestHop = orderedHops
            .OrderByDescending(static hop => (int)hop.HopConfidenceBand)
            .ThenByDescending(static hop => hop.HopOrdinal)
            .First();

        string reason = $"Weakest hop {weakestHop.HopOrdinal} ({weakestHop.EdgeType}) is {weakestHop.HopConfidenceBand} ({weakestHop.ProvenanceKind}).";

        return (weakestHop.HopConfidenceBand, weakestHop.HopOrdinal, reason);
    }
}
