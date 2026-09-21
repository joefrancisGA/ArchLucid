using System.Text.RegularExpressions;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Emits edges when a stored property value cites another snapshot resource by ARM id.
/// </summary>
internal static class AzureInventorySnapshotPropertyArmIdEdgeHydrator
{
    private static readonly Regex ArmResourceIdRegex = new(
        @"/subscriptions/[^/""'\s]+/resource[Gg]roups/[^/""'\s]+/providers/[A-Za-z0-9.]+(?:/[^/""'\s]+)+",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static void AddMissingPropertyArmIdEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId = snapshot.Resources
            .GroupBy(resource => resource.ResourceRowId)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (AzureInventoryResourcePropertyReadModel property in snapshot.Properties)
        {
            if (property.IsRedacted || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            if (!resourcesByRowId.TryGetValue(property.ResourceRowId, out AzureInventoryResourceRecord? owner))
            {
                continue;
            }

            if (!AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    ArmResourceIdNormalizer.Normalize(owner.AzureResourceId),
                    out string fromNodeId))
            {
                continue;
            }

            foreach (string citedArmId in EnumerateCitedArmIds(property.PropertyValue))
            {
                if (ArmResourceIdNormalizer.Normalize(citedArmId)
                    .Equals(ArmResourceIdNormalizer.Normalize(owner.AzureResourceId), StringComparison.Ordinal))
                {
                    continue;
                }

                foreach (string toNodeId in AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(
                             nodeIdByArmId,
                             citedArmId))
                {
                    AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                        edges,
                        edgeKeys,
                        fromNodeId,
                        toNodeId,
                        GraphEdgeTypes.ConnectsTo,
                        GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                        provenanceKind: ProvenanceKind.DeterministicInference.ToString());
                }
            }
        }
    }

    private static IEnumerable<string> EnumerateCitedArmIds(string propertyValue)
    {
        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in ArmResourceIdRegex.Matches(propertyValue))
        {
            string normalized = ArmResourceIdNormalizer.Normalize(match.Value);

            if (!string.IsNullOrWhiteSpace(normalized))
            {
                ids.Add(normalized);
            }
        }

        return ids;
    }
}
