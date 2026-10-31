using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Copies NR-04 indirect-relationship evidence currency onto graph nodes and edges during snapshot resolution.
/// </summary>
internal static class AzureInventorySnapshotIndirectRelationshipGraphHydrator
{
    public static void Hydrate(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges,
        AzureInventorySnapshotGraphIndexes? indexes = null,
        AzureInventorySnapshotResourceIndex? resourceIndex = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        if (nodes.Count == 0)
        {
            return;
        }

        indexes ??= AzureInventorySnapshotGraphIndexes.Create(snapshot, nodes);
        IReadOnlyDictionary<string, GraphNode> nodesByArmId = indexes.NodesByArmId;

        resourceIndex ??= AzureInventorySnapshotResourceIndex.Create(snapshot);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!InventoryDiagramIndirectRelationshipClassifier.TryClassify(resource.ResourceType, out _))
            {
                continue;
            }

            string normalizedArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (!nodesByArmId.TryGetValue(normalizedArmId, out GraphNode? node))
            {
                continue;
            }

            InventoryDiagramEvidenceCurrency? evidenceCurrency =
                InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(resource.SourceEvidenceReference);

            if (evidenceCurrency.HasValue)
            {
                node.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                    evidenceCurrency.Value.ToString();
            }
        }

        Dictionary<string, GraphNode> nodesById = nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if (!InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge))
            {
                continue;
            }

            if (edge.Properties.ContainsKey(InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode))
            {
                continue;
            }

            string fromArmId = ArmResourceIdNormalizer.Normalize(
                fromNode.Properties.TryGetValue("arm.id", out string? armId) ? armId : string.Empty);

            InventoryDiagramEvidenceCurrency? evidenceCurrency =
                InventoryDiagramIndirectRelationshipResolver.ResolveEvidenceCurrency(edge, fromNode);

            if (evidenceCurrency == InventoryDiagramEvidenceCurrency.Current
                && resourceIndex.ByArmId.TryGetValue(fromArmId, out AzureInventoryResourceRecord? sourceResource)
                && InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(
                    sourceResource.SourceEvidenceReference) is InventoryDiagramEvidenceCurrency configuredCurrency)
            {
                evidenceCurrency = configuredCurrency;
            }

            if (evidenceCurrency is not null)
            {
                edge.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                    evidenceCurrency.Value.ToString();
            }

            if (!string.IsNullOrWhiteSpace(edge.InferenceSource))
            {
                edge.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource] =
                    edge.InferenceSource;
            }
        }
    }
}
