using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Links Logic Apps to <c>Microsoft.Web/connections</c> in the same resource group when
///     workflow <c>$connections</c> was not captured. Standard Logic Apps share those connections;
///     Consumption apps in this estate are also colocated with their API connections.
/// </summary>
internal static class AzureInventorySnapshotLogicAppConnectionHydrator
{
    public static void AddMissingConnectionEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId =
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList());

        List<AzureInventoryResourceRecord> logicApps = [];
        List<AzureInventoryResourceRecord> connections = [];

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (IsWebConnection(resource))
            {
                connections.Add(resource);
                continue;
            }

            if (IsLogicApp(resource, propertiesByRowId))
            {
                logicApps.Add(resource);
            }
        }

        if (logicApps.Count == 0 || connections.Count == 0)
        {
            return;
        }

        foreach (AzureInventoryResourceRecord logicApp in logicApps)
        {
            if (!TryResolveNode(nodeIdByArmId, logicApp.AzureResourceId, out string fromNodeId))
            {
                continue;
            }

            string logicAppGroup = logicApp.ResourceGroup ?? string.Empty;

            foreach (AzureInventoryResourceRecord connection in connections)
            {
                if (!ResourceGroupsMatch(logicAppGroup, connection.ResourceGroup))
                {
                    continue;
                }

                if (!TryResolveNode(nodeIdByArmId, connection.AzureResourceId, out string toNodeId))
                {
                    continue;
                }

                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    fromNodeId,
                    toNodeId,
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryLogicAppConnection,
                    provenanceKind: ProvenanceKind.DerivedFact.ToString());
            }
        }
    }

    private static bool IsWebConnection(AzureInventoryResourceRecord resource)
    {
        return (resource.ResourceType ?? string.Empty)
            .Equals("Microsoft.Web/connections", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLogicApp(
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId)
    {
        string resourceType = resource.ResourceType ?? string.Empty;

        if (resourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (propertiesByRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
        {
            foreach (AzureInventoryResourcePropertyReadModel property in properties)
            {
                if (!property.PropertyKey.Equals("kind", StringComparison.OrdinalIgnoreCase)
                    || string.IsNullOrWhiteSpace(property.PropertyValue))
                {
                    continue;
                }

                if (property.PropertyValue.Contains("workflowapp", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
        }

        string name = ReadResourceName(resource.AzureResourceId);

        return name.StartsWith("la-", StringComparison.OrdinalIgnoreCase);
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

    private static bool ResourceGroupsMatch(string left, string? right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
        {
            return false;
        }

        return left.Equals(right, StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadResourceName(string? azureResourceId)
    {
        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return string.Empty;
        }

        int lastSlash = azureResourceId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= azureResourceId.Length - 1)
        {
            return string.Empty;
        }

        return azureResourceId[(lastSlash + 1)..];
    }
}
