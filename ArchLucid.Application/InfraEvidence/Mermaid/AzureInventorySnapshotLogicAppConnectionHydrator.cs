using System.Text.RegularExpressions;

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
    private static readonly Regex ArmResourceIdRegex = new(
        @"/subscriptions/[^/""'\s]+/resource[Gg]roups/[^/""'\s]+/providers/[A-Za-z0-9.]+(?:/[^/""'\s]+)+",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

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

            HashSet<string> citedConnectionIds = EnumerateCitedConnectionIds(
                    logicApp,
                    propertiesByRowId)
                .Select(ArmResourceIdNormalizer.Normalize)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (AzureInventoryResourceRecord connection in connections)
            {
                string connectionId = ArmResourceIdNormalizer.Normalize(connection.AzureResourceId);

                if (!citedConnectionIds.Contains(connectionId))
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
                    AzureInventoryRelationshipAssociationTypes.LogicAppConnection,
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

    private static IEnumerable<string> EnumerateCitedConnectionIds(
        AzureInventoryResourceRecord logicApp,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId)
    {
        if (!propertiesByRowId.TryGetValue(
                logicApp.ResourceRowId,
                out List<AzureInventoryResourcePropertyReadModel>? properties))
        {
            yield break;
        }

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (property.IsRedacted || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            foreach (Match match in ArmResourceIdRegex.Matches(property.PropertyValue))
            {
                yield return match.Value;
            }
        }
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
