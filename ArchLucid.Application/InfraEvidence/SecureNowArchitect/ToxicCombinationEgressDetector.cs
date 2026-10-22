using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class ToxicCombinationEgressDetector
{
    public static IReadOnlyDictionary<string, PrivilegePathEdge> DetectUnrestrictedEgressBySubnet(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<string, PrivilegePathEdge> egressBySubnetArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (relationship.RelationshipType == SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType
                || (relationship.RelationshipType == GraphEdgeTypes.RoutesTo
                    && relationship.ToAzureResourceId.Equals(
                        SecureNowArchitectConstants.InternetEgressNodeId,
                        StringComparison.OrdinalIgnoreCase)))
            {
                egressBySubnetArmId[relationship.FromAzureResourceId] = new PrivilegePathEdge
                {
                    FromNodeId = relationship.FromAzureResourceId,
                    ToNodeId = SecureNowArchitectConstants.InternetEgressNodeId,
                    EdgeType = SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    RoleName = null,
                };
            }
        }

        return egressBySubnetArmId;
    }

    public static string? TryFindSubnetArmId(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(hops);

        foreach (SecurityEvidencePathHopRecord hop in hops)
        {
            if (hop.FromNodeId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
            {
                return hop.FromNodeId;
            }

            if (hop.ToNodeId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
            {
                return hop.ToNodeId;
            }
        }

        return null;
    }
}
