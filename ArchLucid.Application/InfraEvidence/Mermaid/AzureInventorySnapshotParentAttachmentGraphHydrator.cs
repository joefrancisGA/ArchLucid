using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Copies NR-03 parent-attachment metadata onto graph nodes during snapshot resolution.
/// </summary>
internal static class AzureInventorySnapshotParentAttachmentGraphHydrator
{
    public static void Hydrate(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        if (nodes.Count == 0 || snapshot.Resources.Count == 0)
        {
            return;
        }

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId =
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList());

        Dictionary<string, GraphNode> nodesByArmId = nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
            .GroupBy(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!InventoryDiagramParentAttachmentClassifier.TryClassify(resource.ResourceType, out _))
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
            node.Properties[InventoryDiagramParentAttachmentPropertyKeys.EvidenceCurrency] =
                evidenceCurrency.ToString();

            if (!propertiesByRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            Dictionary<string, string> propertyDictionary = properties
                .Where(property => !property.IsRedacted && !string.IsNullOrWhiteSpace(property.PropertyValue))
                .ToDictionary(
                    property => property.PropertyKey,
                    property => property.PropertyValue!,
                    StringComparer.OrdinalIgnoreCase);

            HydrateRestorePointCollection(node, propertyDictionary);
            HydrateAccessConnector(node, resource, propertyDictionary);
        }

        HydrateExplicitParents(snapshot.Relationships, nodesByArmId);
    }

    private static void HydrateRestorePointCollection(
        GraphNode node,
        IReadOnlyDictionary<string, string> properties)
    {
        string? sourceArmId = AzureInventoryRestorePointCollectionSourceParser.Parse(properties);

        if (!string.IsNullOrWhiteSpace(sourceArmId))
        {
            node.Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] = sourceArmId;
        }
    }

    private static void HydrateAccessConnector(
        GraphNode node,
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<string, string> properties)
    {
        string? parentArmId = AzureInventoryAccessConnectorTargetParser.ParseParentArmId(properties);

        if (string.IsNullOrWhiteSpace(parentArmId)
            && !string.IsNullOrWhiteSpace(resource.ParentResourceId))
        {
            parentArmId = ArmResourceIdNormalizer.Normalize(resource.ParentResourceId);
        }

        if (!string.IsNullOrWhiteSpace(parentArmId))
        {
            node.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] = parentArmId;
        }

        string? externalTargetArmId = AzureInventoryAccessConnectorTargetParser.ParseExternalTargetArmId(properties);

        if (!string.IsNullOrWhiteSpace(externalTargetArmId))
        {
            node.Properties[InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] = externalTargetArmId;
        }
    }

    private static void HydrateExplicitParents(
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships,
        IReadOnlyDictionary<string, GraphNode> nodesByArmId)
    {
        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (relationship.InferenceSource is null
                || !relationship.InferenceSource.Equals(
                    GraphEdgeInferenceSources.InventoryExplicitParentChild,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string childArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
            string parentArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

            if (!nodesByArmId.TryGetValue(childArmId, out GraphNode? childNode))
            {
                continue;
            }

            int parentIndex = 0;

            while (childNode.Properties.ContainsKey(
                       $"{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdPrefix}{parentIndex}{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdSuffix}"))
            {
                parentIndex++;
            }

            childNode.Properties[
                    $"{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdPrefix}{parentIndex}{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdSuffix}"] =
                parentArmId;
        }
    }
}
