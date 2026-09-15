using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Diagram-wide peer labels used to keep truncated canvas text correlatable.</summary>
public sealed class DiagramForestCanvasLabelContext
{
    private readonly IReadOnlyList<string> _peerResourceNames;
    private readonly IReadOnlyList<string> _peerResourceGroupNames;
    private readonly DiagramForestLayoutOptions _options;

    private DiagramForestCanvasLabelContext(
        IReadOnlyList<string> peerResourceNames,
        IReadOnlyList<string> peerResourceGroupNames,
        DiagramForestLayoutOptions options)
    {
        _peerResourceNames = peerResourceNames;
        _peerResourceGroupNames = peerResourceGroupNames;
        _options = options;
    }

    public static DiagramForestCanvasLabelContext Create(
        IReadOnlyList<DiagramNode> nodes,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(options);

        List<DiagramNodeHumanCaption> captions = nodes
            .Select(DiagramNodeHumanCaptionFactory.Create)
            .ToList();
        List<string> peerResourceNames = captions
            .Select(caption => caption.ResourceName)
            .ToList();
        List<string> peerResourceGroupNames = captions
            .Select(caption => caption.ResourceGroupCaption)
            .Where(resourceGroup => !string.IsNullOrWhiteSpace(resourceGroup))
            .Select(resourceGroup => resourceGroup!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new DiagramForestCanvasLabelContext(peerResourceNames, peerResourceGroupNames, options);
    }

    public DiagramForestNodeMetrics Measure(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);
        IReadOnlyList<string> nameLines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            caption.ResourceName,
            _peerResourceNames,
            _options);
        IReadOnlyList<string> resourceGroupLines = string.IsNullOrWhiteSpace(caption.ResourceGroupCaption)
            ? []
            : DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
                caption.ResourceGroupCaption,
                _peerResourceGroupNames,
                _options);
        double width = _options.UniformNodeWidth;
        double height = _options.NodePaddingY
            + _options.PictogramSize
            + _options.IconToLabelGap
            + (nameLines.Count * _options.LineHeight)
            + (resourceGroupLines.Count * _options.LineHeight)
            + _options.NodePaddingY;

        return new DiagramForestNodeMetrics(
            Width: width,
            Height: height,
            NameLines: nameLines,
            ResourceGroupLines: resourceGroupLines,
            Caption: caption,
            PictogramKind: DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType),
            HasPrivateEndpointAccess: node.HasPrivateEndpointAccess);
    }
}
