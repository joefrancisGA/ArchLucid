using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Maps hops and nodes to coarse operational cost classes (SA-10).</summary>
public static class SecurityEvidenceCutPointCostClassifier
{
    public static SecurityEvidenceCutPointOperationalCostClass ClassifyEdge(SecurityEvidencePathHopRecord hop)
    {
        ArgumentNullException.ThrowIfNull(hop);

        if (hop.EdgeType.Equals(GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.IdentityFederation;
        }

        if (hop.EdgeType.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.CanAssume, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(SecureNowArchitectConstants.SharedControlFanOutHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.RoleAssignment;
        }

        if (hop.EdgeType.Equals(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.PublicAccessProperty;
        }

        if (hop.EdgeType.Equals(SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.NetworkNsG;
        }

        if (hop.EdgeType.Contains("private-endpoint", StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Contains("private-dns", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.PrivateEndpointDns;
        }

        return SecurityEvidenceCutPointOperationalCostClass.Unknown;
    }

    public static SecurityEvidenceCutPointOperationalCostClass ClassifyNode(string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return SecurityEvidenceCutPointOperationalCostClass.Unknown;
        }

        if (IsSyntheticInternetNode(nodeId))
        {
            return SecurityEvidenceCutPointOperationalCostClass.Unknown;
        }

        if (nodeId.StartsWith("identity:", StringComparison.OrdinalIgnoreCase)
            || nodeId.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.RoleAssignment;
        }

        if (nodeId.StartsWith("principal:", StringComparison.OrdinalIgnoreCase)
            && nodeId.Contains("federated", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.IdentityFederation;
        }

        if (nodeId.StartsWith("principal:", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.RoleAssignment;
        }

        if (nodeId.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase)
            || nodeId.Contains("public-network-access", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.PublicAccessProperty;
        }

        if (nodeId.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || nodeId.Contains("privateDnsZones", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.PrivateEndpointDns;
        }

        if (nodeId.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
            || nodeId.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
        {
            return SecurityEvidenceCutPointOperationalCostClass.NetworkNsG;
        }

        return SecurityEvidenceCutPointOperationalCostClass.Unknown;
    }

    public static bool IsEligibleCutNode(string nodeId) =>
        !string.IsNullOrWhiteSpace(nodeId) && !IsSyntheticInternetNode(nodeId);

    private static bool IsSyntheticInternetNode(string nodeId) =>
        nodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal)
        || nodeId.Equals(SecureNowArchitectConstants.InternetEgressNodeId, StringComparison.Ordinal)
        || nodeId.StartsWith("internet://", StringComparison.OrdinalIgnoreCase);
}
