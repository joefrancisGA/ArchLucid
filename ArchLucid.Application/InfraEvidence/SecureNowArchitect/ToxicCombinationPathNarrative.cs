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
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(hop =>
            SecurityEvidencePathHopRelationshipLabel.FormatHopSegment(
                ShortNodeLabel(hop.FromNodeId),
                hop.EdgeType,
                ShortNodeLabel(hop.ToNodeId)));

        string pathSummary = string.Join("; ", hopDescriptions);
        string egressSuffix = candidate.HasEgressHop
            ? " Includes unrestricted outbound egress on the hosting subnet (declared NSG allow, not observed traffic)."
            : " Outbound egress was not verified on the composed path.";

        string confidenceSuffix = candidate.HasInsufficientEvidenceHop
            ? " Weakest hop: InsufficientEvidence — composed path includes unverified network or identity controls; not observed traffic."
            : " Weakest hop: see path confidence band on the path record.";

        return $"Composed exposure, identity, and asset path (not equal scanner severities).{confidenceSuffix} {pathSummary}.{egressSuffix}";
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

        string segment = lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;

        return string.IsNullOrWhiteSpace(segment)
            ? FourRealityDriftNarrative.NodeNameNotStoredLabel
            : segment;
    }
}
