using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecurityEvidencePathSearchContinuationMerger
{
    public static IReadOnlyList<PrivilegePathCandidate> MergePrivilegeCandidates(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<PrivilegePathCandidate> firstPage,
        IReadOnlyList<PrivilegePathCandidate> continuationPage) =>
        Merge(
            tenantId,
            snapshotId,
            firstPage,
            continuationPage,
            static (tenant, snap, hops) => PrivilegePathMaterializer.BuildHopRecords(tenant, Guid.Empty, snap, hops));

    public static IReadOnlyList<ReachabilityPathCandidate> MergeReachabilityCandidates(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<ReachabilityPathCandidate> firstPage,
        IReadOnlyList<ReachabilityPathCandidate> continuationPage) =>
        Merge(
            tenantId,
            snapshotId,
            firstPage,
            continuationPage,
            static (tenant, snap, hops) => ReachabilityPathMaterializer.BuildHopRecords(tenant, Guid.Empty, snap, hops));

    private static IReadOnlyList<TCandidate> Merge<TCandidate>(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<TCandidate> firstPage,
        IReadOnlyList<TCandidate> continuationPage,
        Func<Guid, Guid, IReadOnlyList<PrivilegePathEdge>, IReadOnlyList<SecurityEvidencePathHopRecord>> buildHopRecords)
        where TCandidate : class
    {
        ArgumentNullException.ThrowIfNull(firstPage);
        ArgumentNullException.ThrowIfNull(continuationPage);
        ArgumentNullException.ThrowIfNull(buildHopRecords);

        HashSet<string> seenCanonicalHashes = new(StringComparer.OrdinalIgnoreCase);
        List<TCandidate> merged = [];

        foreach (TCandidate candidate in firstPage.Concat(continuationPage))
        {
            IReadOnlyList<PrivilegePathEdge> hops = GetHops(candidate);
            byte[] canonicalHash = SecurityEvidencePathCanonicalHash.ComputeSha256(
                buildHopRecords(tenantId, snapshotId, hops));
            string hashKey = Convert.ToHexStringLower(canonicalHash);

            if (!seenCanonicalHashes.Add(hashKey))
            {
                continue;
            }

            merged.Add(candidate);
        }

        return merged;
    }

    private static IReadOnlyList<PrivilegePathEdge> GetHops<TCandidate>(TCandidate candidate) =>
        candidate switch
        {
            PrivilegePathCandidate privilege => privilege.Hops,
            ReachabilityPathCandidate reachability => reachability.Hops,
            _ => throw new ArgumentException("Unsupported candidate type.", nameof(candidate)),
        };
}
