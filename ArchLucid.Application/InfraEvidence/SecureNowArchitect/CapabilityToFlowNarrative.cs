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

        return $"Capability-to-flow: {identity} has possible access to {asset} from cited permissions";
    }

    public static string BuildDescription(CapabilityToFlowCandidate candidate)
    {
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(hop =>
            SecurityEvidencePathHopRelationshipLabel.FormatHopSegment(
                ShortNodeLabel(hop.FromNodeId),
                hop.EdgeType,
                ShortNodeLabel(hop.ToNodeId)));

        string pathSummary = string.Join("; ", hopDescriptions);
        string movement = candidate.Hops.Any(static hop =>
            hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType)
            ? "Possible movement from cited permissions and declared snapshot dependencies."
            : "Possible access from cited permissions.";

        string egress = candidate.HasUnrestrictedEgressHop
            ? " Workload subnet may reach outbound destinations per cited NSG allow rules."
            : " Unrestricted outbound egress on the workload subnet was not stored on this trace.";

        return $"{movement} {pathSummary}.{egress} Business consequence was not stored without a human asset assertion.";
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

        string segment = lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;

        return string.IsNullOrWhiteSpace(segment)
            ? FourRealityDriftNarrative.NodeNameNotStoredLabel
            : segment;
    }
}
