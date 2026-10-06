using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Adds same-resource-group guesses when ARM association rows are missing: Data Factory to the
///     only store, and apps to the only Key Vault. A single virtual network in the group is not a connection.
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
            AddDataFactoryStoreEdges(members, nodeIdByArmId, edges, edgeKeys);
            AddAppKeyVaultEdges(members, nodeIdByArmId, edges, edgeKeys);
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
