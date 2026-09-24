using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Hydrates Recovery Services <c>PROTECTS</c> edges from vault protected-item properties (RSV-03).</summary>
internal static class AzureInventorySnapshotRecoveryServicesEdgeHydrator
{
    public static void AddMissingProtectionEdges(
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
            if (!string.Equals(
                    property.PropertyKey,
                    AzureInventoryRecoveryServices.ProtectedItemsPropertyKey,
                    StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            if (!resourcesByRowId.TryGetValue(property.ResourceRowId, out AzureInventoryResourceRecord? vaultResource))
            {
                continue;
            }

            if (!string.Equals(
                    vaultResource.ResourceType,
                    AzureInventoryRecoveryServices.VaultResourceType,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!nodeIdByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(vaultResource.AzureResourceId),
                    out string? fromNodeId)
                || string.IsNullOrWhiteSpace(fromNodeId))
            {
                continue;
            }

            foreach (AzureInventoryRecoveryServicesProtectedItemRow item in ReadProtectedItems(property.PropertyValue))
            {
                if (!item.CollectionStatus.Equals(
                        AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                        StringComparison.OrdinalIgnoreCase)
                    || string.IsNullOrWhiteSpace(item.SourceResourceId))
                {
                    continue;
                }

                string normalizedSourceId = ArmResourceIdNormalizer.Normalize(item.SourceResourceId);

                if (!nodeIdByArmId.TryGetValue(normalizedSourceId, out string? toNodeId)
                    || string.IsNullOrWhiteSpace(toNodeId))
                {
                    continue;
                }

                bool isReplication = string.Equals(
                    item.ItemKind,
                    AzureInventoryRecoveryServices.ReplicationItemKind,
                    StringComparison.OrdinalIgnoreCase);
                string inferenceSource = isReplication
                    ? GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates
                    : GraphEdgeInferenceSources.InventoryRecoveryServicesProtects;
                string label = isReplication
                    ? AzureInventoryRecoveryServices.ReplicateEdgeLabel
                    : AzureInventoryRecoveryServices.BackupEdgeLabel;

                string edgeKey = $"{fromNodeId}|{toNodeId}|{GraphEdgeTypes.Protects}";

                if (!edgeKeys.Add(edgeKey))
                {
                    continue;
                }

                GraphEdge edge = new()
                {
                    EdgeId = $"edge-{edgeKey}",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = GraphEdgeTypes.Protects,
                    Label = label,
                    Weight = 1.0d,
                    InferenceSource = inferenceSource,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                };

                if (!string.IsNullOrWhiteSpace(item.TargetRegion))
                {
                    edge.Properties[AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey] = item.TargetRegion;
                }

                if (!string.IsNullOrWhiteSpace(item.TargetResourceId))
                {
                    edge.Properties[AzureInventoryRecoveryServices.EdgeTargetResourceIdPropertyKey] =
                        ArmResourceIdNormalizer.Normalize(item.TargetResourceId);
                }

                edges.Add(edge);
            }
        }
    }

    private static IEnumerable<AzureInventoryRecoveryServicesProtectedItemRow> ReadProtectedItems(string propertyValue)
    {
        try
        {
            List<AzureInventoryRecoveryServicesProtectedItemRow>? rows =
                JsonSerializer.Deserialize<List<AzureInventoryRecoveryServicesProtectedItemRow>>(propertyValue);

            if (rows is null)
            {
                return [];
            }

            return rows;
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
