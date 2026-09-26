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
        IReadOnlyList<GraphEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        if (nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> nodesByArmId = nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
            .GroupBy(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        Dictionary<string, InventoryDiagramEvidenceCurrency> evidenceCurrencyByArmId = snapshot.Resources
            .Where(resource => !string.IsNullOrWhiteSpace(resource.AzureResourceId))
            .GroupBy(
                resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(
                    group.First().SourceEvidenceReference),
                StringComparer.OrdinalIgnoreCase);

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

            InventoryDiagramEvidenceCurrency evidenceCurrency =
                InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(resource.SourceEvidenceReference);
            node.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                evidenceCurrency.ToString();
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

            InventoryDiagramEvidenceCurrency evidenceCurrency =
                InventoryDiagramIndirectRelationshipResolver.ResolveEvidenceCurrency(edge, fromNode);

            bool hasExplicitEdgeCurrency =
                edge.Properties.TryGetValue(
                    InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency,
                    out string? edgeCurrency)
                && Enum.TryParse(
                    edgeCurrency,
                    ignoreCase: true,
                    out InventoryDiagramEvidenceCurrency _);

            if (!hasExplicitEdgeCurrency
                && evidenceCurrency == InventoryDiagramEvidenceCurrency.Current
                && evidenceCurrencyByArmId.TryGetValue(
                    fromArmId,
                    out InventoryDiagramEvidenceCurrency configuredCurrency))
            {
                evidenceCurrency = configuredCurrency;
            }

            edge.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency] =
                evidenceCurrency.ToString();

            if (!string.IsNullOrWhiteSpace(edge.InferenceSource))
            {
                edge.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource] =
                    edge.InferenceSource;
            }
        }
    }
}
