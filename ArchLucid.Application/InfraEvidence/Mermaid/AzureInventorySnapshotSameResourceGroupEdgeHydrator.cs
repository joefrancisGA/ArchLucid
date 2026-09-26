using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Adds same-resource-group edges when ARM association rows are missing: a single VNet
///     places compute/data in that group, ADF talks to colocated stores, and apps use colocated vaults.
/// </summary>
internal static class AzureInventorySnapshotSameResourceGroupEdgeHydrator
{
    public static void AddMissingCollocationEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        ILookup<string, AzureInventoryResourceRecord> byResourceGroup = snapshot.Resources
            .Where(resource => !string.IsNullOrWhiteSpace(resource.ResourceGroup))
            .ToLookup(resource => resource.ResourceGroup!, StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AzureInventoryResourceRecord> group in byResourceGroup)
        {
            List<AzureInventoryResourceRecord> members = group.ToList();
            AddSingleVnetPlacement(members, nodeIdByArmId, edges, edgeKeys);
            AddDataFactoryStoreEdges(members, nodeIdByArmId, edges, edgeKeys);
            AddAppKeyVaultEdges(members, nodeIdByArmId, edges, edgeKeys);
        }
    }

    private static void AddSingleVnetPlacement(
        IReadOnlyList<AzureInventoryResourceRecord> members,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        List<AzureInventoryResourceRecord> vnets = members
            .Where(member => AzureInventoryTopologyCategory.IsVirtualNetworkArmType(member.ResourceType ?? string.Empty))
            .ToList();

        if (vnets.Count != 1)
        {
            return;
        }

        if (!TryResolveNode(nodeIdByArmId, vnets[0].AzureResourceId, out string vnetNodeId))
        {
            return;
        }

        foreach (AzureInventoryResourceRecord member in members)
        {
            if (!IsVnetPlacedWorkload(member.ResourceType))
            {
                continue;
            }

            if (!TryResolveNode(nodeIdByArmId, member.AzureResourceId, out string fromNodeId))
            {
                continue;
            }

            if (AzureInventorySnapshotCitedEdgePolicy.HasCitedEdgeFrom(
                    edges,
                    fromNodeId,
                    vnetNodeId))
            {
                continue;
            }

            AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                edges,
                edgeKeys,
                fromNodeId,
                vnetNodeId,
                GraphEdgeTypes.ConnectsTo,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                label: "in",
                provenanceKind: ProvenanceKind.DeterministicInference.ToString());
        }

        foreach (AzureInventoryResourceRecord nsg in members.Where(member => IsNetworkSecurityGroup(member.ResourceType)))
        {
            if (!TryResolveNode(nodeIdByArmId, nsg.AzureResourceId, out string nsgNodeId))
            {
                continue;
            }

            AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                edges,
                edgeKeys,
                vnetNodeId,
                nsgNodeId,
                GraphEdgeTypes.AppliesTo,
                GraphEdgeInferenceSources.InventorySubnetNsg,
                provenanceKind: ProvenanceKind.DeterministicInference.ToString());
        }
    }

    private static void AddDataFactoryStoreEdges(
        IReadOnlyList<AzureInventoryResourceRecord> members,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        List<AzureInventoryResourceRecord> factories = members.Where(member => IsDataFactory(member.ResourceType)).ToList();
        List<AzureInventoryResourceRecord> stores = members.Where(member => IsDataStore(member.ResourceType)).ToList();

        if (factories.Count == 0 || stores.Count != 1)
        {
            return;
        }

        foreach (AzureInventoryResourceRecord factory in factories)
        {
            if (!TryResolveNode(nodeIdByArmId, factory.AzureResourceId, out string fromNodeId))
            {
                continue;
            }

            if (AzureInventorySnapshotCitedEdgePolicy.HasCitedEdgeFrom(edges, fromNodeId))
            {
                continue;
            }

            foreach (AzureInventoryResourceRecord store in stores)
            {
                if (!TryResolveNode(nodeIdByArmId, store.AzureResourceId, out string toNodeId))
                {
                    continue;
                }

                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    fromNodeId,
                    toNodeId,
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
                    provenanceKind: ProvenanceKind.DeterministicInference.ToString());
            }
        }
    }

    private static void AddAppKeyVaultEdges(
        IReadOnlyList<AzureInventoryResourceRecord> members,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        List<AzureInventoryResourceRecord> apps = members.Where(member => IsKeyVaultConsumer(member.ResourceType)).ToList();
        List<AzureInventoryResourceRecord> vaults = members.Where(member => IsKeyVault(member.ResourceType)).ToList();

        if (apps.Count == 0 || vaults.Count != 1)
        {
            return;
        }

        foreach (AzureInventoryResourceRecord app in apps)
        {
            if (!TryResolveNode(nodeIdByArmId, app.AzureResourceId, out string fromNodeId))
            {
                continue;
            }

            if (AzureInventorySnapshotCitedEdgePolicy.HasCitedEdgeFrom(edges, fromNodeId))
            {
                continue;
            }

            foreach (AzureInventoryResourceRecord vault in vaults)
            {
                if (!TryResolveNode(nodeIdByArmId, vault.AzureResourceId, out string toNodeId))
                {
                    continue;
                }

                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    fromNodeId,
                    toNodeId,
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
                    provenanceKind: ProvenanceKind.DeterministicInference.ToString());
            }
        }
    }

    private static bool TryResolveNode(
        Dictionary<string, string> nodeIdByArmId,
        string? azureResourceId,
        out string nodeId)
    {
        return AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
            nodeIdByArmId,
            ArmResourceIdNormalizer.Normalize(azureResourceId),
            out nodeId);
    }

    private static bool IsVnetPlacedWorkload(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        if (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(resourceType)
            || AzureInventoryTopologyCategory.IsSubnetArmType(resourceType)
            || resourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return resourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.DBforMySQL", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.DocumentDB", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.DataFactory/factories", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.ContainerService/managedClusters", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNetworkSecurityGroup(string? resourceType)
    {
        return (resourceType ?? string.Empty).Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataFactory(string? resourceType)
    {
        return AzureInventoryTopologyCategory.IsDataIntegrationArmType(resourceType);
    }

    private static bool IsDataStore(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType) || IsDataFactory(resourceType))
        {
            return false;
        }

        return resourceType.Contains("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.DBforMySQL", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.DocumentDB", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsKeyVaultConsumer(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase)
            || IsDataFactory(resourceType);
    }

    private static bool IsKeyVault(string? resourceType)
    {
        return (resourceType ?? string.Empty).Contains("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase);
    }
}
