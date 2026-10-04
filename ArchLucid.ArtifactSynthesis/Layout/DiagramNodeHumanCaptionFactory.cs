using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramNodeHumanCaptionFactory
{
    public static string? TryFormatDataFlowTypeCaption(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (!string.IsNullOrWhiteSpace(node.ExternalLinkedServiceType))
        {
            string linkedServiceType = node.ExternalLinkedServiceType.Trim();

            return linkedServiceType switch
            {
                "AzureBlobStorage" or "AzureBlobFS" => "Blob link",
                "AzureMySql" => "MySQL link",
                "Sftp" => "SFTP link",
                "HttpServer" or "Web" or "RestService" => "HTTP link",
                _ => $"{linkedServiceType} link",
            };
        }

        if (node.ArmResourceType?.Equals("Microsoft.Web/connections", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "Logic App connection";
        }

        if (node.ArmResourceType?.Equals("Microsoft.Databricks/accessConnectors", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "Access connector";
        }

        if (node.ArmResourceType?.Equals("Microsoft.Fabric/capacities", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "Fabric capacity";
        }

        if (node.ArmResourceType?.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase) == true)
        {
            return node.ArmResourceKind?.Split(',', 2, StringSplitOptions.TrimEntries)[0]
                .Equals("functionapp", StringComparison.OrdinalIgnoreCase) == true
                ? "Function App"
                : "App Service";
        }

        return DiagramArmTypeFriendlyName.TryFormat(node.ArmResourceType);
    }

    public static DiagramNodeHumanCaption Create(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string resourceName = string.IsNullOrWhiteSpace(node.Label)
            ? node.NodeId
            : MermaidDiagramRenderer.EscapeLabel(node.Label);
        string? typeCaption = node.IsDataFlowRollup
            ? null
            : DiagramArmTypeFriendlyName.TryFormat(node.ArmResourceType);
        string combined = string.IsNullOrWhiteSpace(typeCaption)
            ? resourceName
            : $"{resourceName} ({typeCaption})";

        if (node.ParentAttachmentDetails.Count > 0)
        {
            combined = $"{combined} · {string.Join(" · ", node.ParentAttachmentDetails)}";
        }

        if (node.ConnectionState == InventoryDiagramConnectionState.Orphaned
            && !string.IsNullOrWhiteSpace(node.ConnectionStateMessage))
        {
            combined = $"{combined} · Missing a required link: {node.ConnectionStateMessage.Trim()}";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Used)
        {
            combined = string.IsNullOrWhiteSpace(node.ConnectionStateMessage)
                ? $"{combined} · In use off the diagram"
                : $"{combined} · In use off the diagram: {node.ConnectionStateMessage.Trim()}";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Unconnected)
        {
            combined = $"{combined} · Stands alone";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Unknown)
        {
            combined = $"{combined} · Needs evidence";
        }

        if (node.UnresolvedRelationshipDetails.Count > 0)
        {
            combined = $"{combined} · {string.Join(" · ", node.UnresolvedRelationshipDetails)}";
        }

        if (node.DataFlowTraversalHopEvidenceDetails.Count > 0)
        {
            combined = $"{combined} · {string.Join(" · ", node.DataFlowTraversalHopEvidenceDetails)}";
        }
        string? resourceGroupCaption = string.IsNullOrWhiteSpace(node.ArmResourceGroup)
            ? null
            : node.ArmResourceGroup.Trim();
        if (node.IncludeResourceGroupInCaption && resourceGroupCaption is not null)
        {
            combined = $"{combined} · {resourceGroupCaption}";
        }
        string accessibilityTitle = string.IsNullOrWhiteSpace(resourceGroupCaption)
            ? combined
            : $"{combined} · {resourceGroupCaption}";

        return new DiagramNodeHumanCaption(
            ResourceName: resourceName,
            TypeCaption: typeCaption,
            ResourceGroupCaption: resourceGroupCaption,
            CombinedPlainText: combined,
            AccessibilityTitle: accessibilityTitle);
    }
}
