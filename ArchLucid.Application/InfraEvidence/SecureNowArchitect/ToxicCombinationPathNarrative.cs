using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationPathNarrative
{
    public static string BuildTitle(ToxicCombinationCandidate candidate)
    {
        string exposure = ShortNodeLabel(candidate.ReachabilityStartNodeId);
        string identity = ShortNodeLabel(candidate.PrivilegeIdentityNodeId);
        string asset = ShortNodeLabel(candidate.SharedAssetNodeId);

        return $"Toxic combination: {exposure} → {identity} → {asset}";
    }

    public static string BuildDescription(ToxicCombinationCandidate candidate)
    {
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(static hop =>
            $"{ShortNodeLabel(hop.FromNodeId)} -[{hop.EdgeType}]-> {ShortNodeLabel(hop.ToNodeId)}");

        string pathSummary = string.Join("; ", hopDescriptions);
        string egressSuffix = candidate.HasEgressHop
            ? " Includes unrestricted outbound egress on the hosting subnet."
            : string.Empty;

        return $"Composed exposure, identity, and asset path (not equal scanner severities). {pathSummary}.{egressSuffix}";
    }

    private static string ShortNodeLabel(string nodeId)
    {
        if (nodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal))
        {
            return "internet";
        }

        if (nodeId.Equals(SecureNowArchitectConstants.InternetEgressNodeId, StringComparison.Ordinal))
        {
            return "egress";
        }

        if (nodeId.StartsWith("azure-ad://principal/", StringComparison.Ordinal))
        {
            return $"principal:{nodeId[^8..]}";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
