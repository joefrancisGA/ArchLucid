using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Diagram-wide peer labels used to keep truncated canvas text correlatable.</summary>
public sealed class DiagramForestCanvasLabelContext
{
    private readonly IReadOnlyList<string> _peerResourceNames;
    private readonly DiagramForestLayoutOptions _options;

    private DiagramForestCanvasLabelContext(
        IReadOnlyList<string> peerResourceNames,
        DiagramForestLayoutOptions options)
    {
        _peerResourceNames = peerResourceNames;
        _options = options;
    }

    public static DiagramForestCanvasLabelContext Create(
        IReadOnlyList<DiagramNode> nodes,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(options);

        List<string> peerResourceNames = nodes
            .Select(node => DiagramNodeHumanCaptionFactory.Create(node).ResourceName)
            .ToList();

        return new DiagramForestCanvasLabelContext(peerResourceNames, options);
    }

    public DiagramForestNodeMetrics Measure(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);
        IReadOnlyList<string> nameLines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            caption.ResourceName,
            _peerResourceNames,
            _options);
        double width = _options.UniformNodeWidth;
        double height = _options.NodePaddingY
            + _options.PictogramSize
            + _options.IconToLabelGap
            + (nameLines.Count * _options.LineHeight)
            + _options.NodePaddingY;

        return new DiagramForestNodeMetrics(
            Width: width,
            Height: height,
            NameLines: nameLines,
            Caption: caption,
            PictogramKind: DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType));
    }
}
