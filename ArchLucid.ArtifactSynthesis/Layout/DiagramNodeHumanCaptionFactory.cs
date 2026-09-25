using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramNodeHumanCaptionFactory
{
    public static DiagramNodeHumanCaption Create(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string resourceName = string.IsNullOrWhiteSpace(node.Label)
            ? node.NodeId
            : MermaidDiagramRenderer.EscapeLabel(node.Label);
        string? typeCaption = DiagramArmTypeFriendlyName.TryFormat(node.ArmResourceType);
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
            combined = $"{combined} · Orphaned: {node.ConnectionStateMessage.Trim()}";
        }
        else if (node.ConnectionState == InventoryDiagramConnectionState.Unconnected)
        {
            combined = $"{combined} · Unconnected";
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
