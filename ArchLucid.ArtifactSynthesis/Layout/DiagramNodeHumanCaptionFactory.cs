using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

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
