using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class IntendedReachabilityPathNarrative
{
    public static string BuildTitle(ReachabilityPathCandidate candidate)
    {
        string start = ShortNodeLabel(candidate.Hops[0].FromNodeId);
        string asset = ShortNodeLabel(candidate.TerminalAssetNodeId);

        return $"Intended reachability: {start} → {asset}";
    }

    public static string BuildDescription(ReachabilityPathCandidate candidate)
    {
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(static hop =>
            $"{ShortNodeLabel(hop.FromNodeId)} -[{hop.EdgeType}]-> {ShortNodeLabel(hop.ToNodeId)}");

        string pathSummary = string.Join("; ", hopDescriptions);

        return $"Intended control-plane path (not observed traffic). {pathSummary}.";
    }

    private static string ShortNodeLabel(string nodeId)
    {
        if (nodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal))
        {
            return "internet";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
