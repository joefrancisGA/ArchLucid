using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramNodeHumanCaptionFactory
{
    public const string ResourceTypeNotStoredCaption = "Resource type was not stored";
    public const string ResourceGroupNotStoredCaption = "Resource group was not stored.";

    public static string? TryFormatDataFlowTypeCaption(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (!string.IsNullOrWhiteSpace(node.ExternalLinkedServiceType))
        {
            string linkedServiceType = node.ExternalLinkedServiceType.Trim();

            return linkedServiceType switch
            {
                "AzureBlobStorage" or "AzureBlobFS" => "Blob linked-service type",
                "AzureMySql" => "MySQL linked-service type",
                "Sftp" => "SFTP linked-service type",
                "HttpServer" or "Web" or "RestService" => "HTTP linked-service type",
                _ => $"Linked service type {linkedServiceType} has no reviewer label.",
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
            string? siteKind = node.ArmResourceKind?.Split(',', 2, StringSplitOptions.TrimEntries)[0];

            if (string.IsNullOrWhiteSpace(siteKind))
            {
                return "Site kind was not stored.";
            }

            if (siteKind.Equals("functionapp", StringComparison.OrdinalIgnoreCase))
            {
                return "Function App";
            }

            if (siteKind.Equals("app", StringComparison.OrdinalIgnoreCase)
                || siteKind.Equals("api", StringComparison.OrdinalIgnoreCase))
            {
                return "App Service";
            }

            return $"Site kind {siteKind} has no reviewer label.";
        }

        return DiagramArmTypeFriendlyName.TryFormat(node.ArmResourceType);
    }

    public static DiagramNodeHumanCaption Create(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string resourceName = string.IsNullOrWhiteSpace(node.Label)
            ? "Resource name was not stored"
            : MermaidDiagramRenderer.EscapeLabel(node.Label);
        string? typeCaption = node.IsDataFlowRollup
            ? null
            : DiagramArmTypeFriendlyName.TryFormat(node.ArmResourceType);
        string combined = string.IsNullOrWhiteSpace(typeCaption)
            ? resourceName
            : $"{resourceName} ({typeCaption})";

        if (!node.IsDataFlowRollup && string.IsNullOrWhiteSpace(typeCaption))
        {
            combined = $"{combined} · {ResourceTypeNotStoredCaption}";
        }

        if (node.ParentAttachmentDetails.Count > 0)
        {
            combined = $"{combined} · {string.Join(" · ", node.ParentAttachmentDetails)}";
        }

        if (node.HasPrivateEndpointAccess)
        {
            string privateEndpointCaption = string.IsNullOrWhiteSpace(node.PrivateEndpointAccessName)
                ? DiagramForestPrivateEndpointEdgeAccessibility.FormatEdgeTitle(null)
                : DiagramForestPrivateEndpointEdgeAccessibility.FormatEdgeTitle(node.PrivateEndpointAccessName);
            combined = $"{combined} · {privateEndpointCaption}";
        }

        if (node.HasPublicInternetExposure)
        {
            combined =
                $"{combined} · {InventoryDiagramRelationshipLabelTexts.FormatHiddenPublicIpCaption(node.HiddenPublicIpAddress)}";
        }

        if (node.ConnectionState == InventoryDiagramConnectionState.Orphaned
            && !string.IsNullOrWhiteSpace(node.ConnectionStateMessage))
        {
            combined = $"{combined} · No stored association: {node.ConnectionStateMessage.Trim()}.";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Used)
        {
            combined = string.IsNullOrWhiteSpace(node.ConnectionStateMessage)
                ? $"{combined} · Off-diagram use was not stored."
                : $"{combined} · In use off the diagram: {node.ConnectionStateMessage.Trim()}";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Unconnected)
        {
            combined = $"{combined} · No diagram link was stored.";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Unknown
            && node.UnresolvedRelationshipDetails.Count == 0)
        {
            combined = $"{combined} · Connection state was stored as unknown.";
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
        if (node.IncludeResourceGroupInCaption)
        {
            combined = resourceGroupCaption is not null
                ? $"{combined} · {resourceGroupCaption}"
                : $"{combined} · {ResourceGroupNotStoredCaption}";
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
