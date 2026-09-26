using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Retargets Event Hub capture and diagnostic edges onto the namespace card when the child hub is not inventoried (MB-EH).
/// </summary>
internal static class AzureInventoryEventHubVisibleEndpointResolver
{
    public static HashSet<string> BuildInventoriedArmIds(IEnumerable<string> armResourceIds)
    {
        ArgumentNullException.ThrowIfNull(armResourceIds);

        HashSet<string> inventoried = new(StringComparer.OrdinalIgnoreCase);

        foreach (string armResourceId in armResourceIds)
        {
            if (string.IsNullOrWhiteSpace(armResourceId))
            {
                continue;
            }

            inventoried.Add(ArmResourceIdNormalizer.Normalize(armResourceId));
        }

        return inventoried;
    }

    public static void ResolveCaptureEdge(
        AzureInventoryMessagingAssociationRow association,
        IReadOnlySet<string> inventoriedArmIds,
        out string fromAzureResourceId,
        out string inferenceSource)
    {
        ArgumentNullException.ThrowIfNull(association);
        ArgumentNullException.ThrowIfNull(inventoriedArmIds);

        string childId = ArmResourceIdNormalizer.Normalize(association.ChildResourceId);
        string parentId = ArmResourceIdNormalizer.Normalize(association.ParentResourceId);
        fromAzureResourceId = childId;
        inferenceSource = GraphEdgeInferenceSources.InventoryEventHubCapture;

        if (inventoriedArmIds.Contains(childId))
        {
            return;
        }

        if (!inventoriedArmIds.Contains(parentId))
        {
            return;
        }

        fromAzureResourceId = parentId;

        if (!string.IsNullOrWhiteSpace(association.ChildName))
        {
            inferenceSource = GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryEventHubCapture,
                association.ChildName);
        }
    }

    public static void ResolveDiagnosticDestination(
        string destinationArmId,
        IReadOnlySet<string> inventoriedArmIds,
        out string resolvedDestinationArmId,
        out string inferenceSource)
    {
        ArgumentNullException.ThrowIfNull(inventoriedArmIds);

        resolvedDestinationArmId = ArmResourceIdNormalizer.Normalize(destinationArmId);
        inferenceSource = GraphEdgeInferenceSources.InventoryDiagnosticDestination;

        if (!AzureInventoryEventHubArmPath.IsEventHubNamespaceOrChild(resolvedDestinationArmId))
        {
            return;
        }

        string? hubName = null;

        if (AzureInventoryEventHubArmPath.TryGetEventHubName(resolvedDestinationArmId, out string parsedHubName))
        {
            hubName = parsedHubName;
        }

        if (inventoriedArmIds.Contains(resolvedDestinationArmId))
        {
            if (!string.IsNullOrWhiteSpace(hubName))
            {
                inferenceSource = GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryDiagnosticDestination,
                    hubName);
            }

            return;
        }

        if (AzureInventoryEventHubArmPath.TryGetNamespaceId(resolvedDestinationArmId, out string namespaceId)
            && inventoriedArmIds.Contains(namespaceId))
        {
            resolvedDestinationArmId = namespaceId;

            if (!string.IsNullOrWhiteSpace(hubName))
            {
                inferenceSource = GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryDiagnosticDestination,
                    hubName);
            }
        }
    }
}
