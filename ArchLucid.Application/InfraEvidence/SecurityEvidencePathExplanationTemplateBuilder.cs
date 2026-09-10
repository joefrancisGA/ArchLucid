using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecurityEvidencePathExplanationTemplateBuilder
{
    public static SecurityEvidencePathExplanationTemplateResponse Build(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);

        if (hops.Count == 0)
        {
            return new SecurityEvidencePathExplanationTemplateResponse
            {
                WeakControl = path.WeakestHopReason,
            };
        }

        SecurityEvidencePathHopRecord firstHop = hops[0];
        SecurityEvidencePathHopRecord lastHop = hops[^1];
        SecurityEvidencePathHopRecord? weakestHop = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal)
                                           ?? hops.OrderByDescending(static hop => (int)hop.HopConfidenceBand).First();

        string? identity = ResolveIdentityLabel(hops);
        string? network = ResolveNetworkLabel(hops);

        return new SecurityEvidencePathExplanationTemplateResponse
        {
            Actor = ShortNodeLabel(firstHop.FromNodeId),
            Identity = identity,
            Network = network,
            Asset = ShortNodeLabel(lastHop.ToNodeId),
            WeakControl = string.IsNullOrWhiteSpace(path.WeakestHopReason)
                ? $"{weakestHop.EdgeType} ({weakestHop.HopConfidenceBand})"
                : path.WeakestHopReason,
            Verify = null,
        };
    }

    private static string? ResolveIdentityLabel(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        IEnumerable<string> identityLabels = hops
            .Where(static hop => hop.EdgeType is GraphEdgeTypes.UsesIdentity
                or GraphEdgeTypes.CanAssume
                or GraphEdgeTypes.HasRole
                or GraphEdgeTypes.FederatesAs)
            .SelectMany(static hop => new[] { hop.FromNodeId, hop.ToNodeId })
            .Where(static nodeId => nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal)
                || nodeId.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            .Select(ShortNodeLabel)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        string joined = string.Join(" → ", identityLabels);

        return string.IsNullOrWhiteSpace(joined) ? null : joined;
    }

    private static string? ResolveNetworkLabel(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        SecurityEvidencePathHopRecord? networkHop = hops.FirstOrDefault(static hop =>
            hop.EdgeType is GraphEdgeTypes.RoutesTo or GraphEdgeTypes.Exposes);

        if (networkHop is null)
        {
            return null;
        }

        return $"{ShortNodeLabel(networkHop.FromNodeId)} → {ShortNodeLabel(networkHop.ToNodeId)}";
    }

    internal static string ShortNodeLabel(string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return string.Empty;
        }

        if (nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
        {
            return $"principal:{nodeId[^8..]}";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
