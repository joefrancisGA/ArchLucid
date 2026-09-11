using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowAssetClassifier
{
    public static bool IsDataBearingAsset(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.Sql/managedInstances", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("storageAccounts", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("vaults", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.DBfor", StringComparison.OrdinalIgnoreCase);
    }

    public static string ResolveAssetLabel(string? resourceType, string assetNodeId)
    {
        if (resourceType?.Contains("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "data-bearing SQL asset";
        }

        if (resourceType?.Contains("storageAccounts", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "data-bearing storage asset";
        }

        int lastSlash = assetNodeId.LastIndexOf('/');

        return lastSlash >= 0 ? assetNodeId[(lastSlash + 1)..] : assetNodeId;
    }
}

internal static class CapabilityToFlowWorkloadSubnetResolver
{
    public static string? TryResolveSubnetArmId(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<PrivilegePathEdge> privilegeHops)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(privilegeHops);

        HashSet<string> pathNodes = new(StringComparer.OrdinalIgnoreCase);

        foreach (PrivilegePathEdge hop in privilegeHops)
        {
            pathNodes.Add(hop.FromNodeId);
            pathNodes.Add(hop.ToNodeId);
        }

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!relationship.RelationshipType.Equals(GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (pathNodes.Contains(relationship.FromAzureResourceId)
                && relationship.ToAzureResourceId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
            {
                return relationship.ToAzureResourceId;
            }

            if (pathNodes.Contains(relationship.ToAzureResourceId)
                && relationship.FromAzureResourceId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
            {
                return relationship.FromAzureResourceId;
            }
        }

        return null;
    }
}
