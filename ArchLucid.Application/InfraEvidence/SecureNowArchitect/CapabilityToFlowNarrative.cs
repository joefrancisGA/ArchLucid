using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowNarrative
{
    public static string BuildTitle(CapabilityToFlowCandidate candidate)
    {
        string identity = ShortNodeLabel(candidate.WorkloadIdentityNodeId);
        string asset = CapabilityToFlowAssetClassifier.ResolveAssetLabel(
            candidate.TerminalResourceType,
            candidate.DataAssetNodeId);

        return $"Capability-to-flow: {identity} may access {asset}";
    }

    public static string BuildDescription(CapabilityToFlowCandidate candidate)
    {
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(static hop =>
            $"{ShortNodeLabel(hop.FromNodeId)} -[{hop.EdgeType}]-> {ShortNodeLabel(hop.ToNodeId)}");

        string pathSummary = string.Join("; ", hopDescriptions);
        string movement = candidate.Hops.Any(static hop =>
            hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType)
            ? "Possible movement from cited permissions and declared snapshot dependencies."
            : "Possible access from cited permissions.";

        string egress = candidate.HasUnrestrictedEgressHop
            ? " Workload subnet may reach outbound destinations per cited NSG allow rules."
            : " Outbound egress is not fully verified on the workload subnet.";

        return $"{movement} {pathSummary}.{egress} Business consequence remains Unknown without a human asset assertion.";
    }

    private static string ShortNodeLabel(string nodeId)
    {
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
