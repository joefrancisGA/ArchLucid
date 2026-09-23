using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Diagram-wide peer labels used to keep truncated canvas text correlatable.</summary>
public sealed class DiagramForestCanvasLabelContext
{
    private readonly IReadOnlyList<string> _peerResourceNames;
    private readonly IReadOnlyList<string> _peerResourceGroupNames;
    private readonly DiagramForestLayoutOptions _options;
    private readonly HashSet<string> _suppressResourceGroupCaptionNodeIds;
    private readonly AzureArchitectureIconCatalog _iconCatalog;

    private DiagramForestCanvasLabelContext(
        IReadOnlyList<string> peerResourceNames,
        IReadOnlyList<string> peerResourceGroupNames,
        DiagramForestLayoutOptions options,
        HashSet<string> suppressResourceGroupCaptionNodeIds,
        AzureArchitectureIconCatalog iconCatalog)
    {
        _peerResourceNames = peerResourceNames;
        _peerResourceGroupNames = peerResourceGroupNames;
        _options = options;
        _suppressResourceGroupCaptionNodeIds = suppressResourceGroupCaptionNodeIds;
        _iconCatalog = iconCatalog;
    }

    public static DiagramForestCanvasLabelContext Create(
        IReadOnlyList<DiagramNode> nodes,
        DiagramForestLayoutOptions options,
        AzureArchitectureIconCatalog? iconCatalog = null)
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
        HashSet<string> suppressResourceGroupCaptionNodeIds =
            DiagramResourceGroupPacker.ResolveNodesWithSuppressedCaption(nodes);

        return new DiagramForestCanvasLabelContext(
            peerResourceNames,
            peerResourceGroupNames,
            options,
            suppressResourceGroupCaptionNodeIds,
            iconCatalog ?? AzureArchitectureIconCatalog.Load());
    }

    public DiagramForestNodeMetrics Measure(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);
        int textColumnMaxWidth = DiagramInventoryNodeCanvasLabelFormatter.ResolveInnerLabelWidthPx(_options);
        IReadOnlyList<string> nameLines = DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
            caption.ResourceName,
            _peerResourceNames,
            _options,
            textColumnMaxWidth);
        bool suppressResourceGroupCaption = _suppressResourceGroupCaptionNodeIds.Contains(node.NodeId);
        IReadOnlyList<string> resourceGroupLines = suppressResourceGroupCaption
            || string.IsNullOrWhiteSpace(caption.ResourceGroupCaption)
            ? []
            : DiagramInventoryNodeCanvasLabelFormatter.FormatLines(
                caption.ResourceGroupCaption,
                _peerResourceGroupNames,
                _options,
                textColumnMaxWidth);
        int longestLineChars = nameLines
            .Concat(resourceGroupLines)
            .Select(line => line.Length)
            .DefaultIfEmpty(0)
            .Max();
        double privateEndpointIndicatorWidth = node.HasPrivateEndpointAccess
            ? DiagramForestPrivateEndpointAccessSvgEmitter.ReservedWidth
            : 0.0d;
        double textColumnWidth = Math.Max(
            _options.MinNodeWidth
                - ((_options.NodePaddingX * 2)
                    + privateEndpointIndicatorWidth
                    + _options.PictogramSize
                    + _options.IconToLabelGap),
            longestLineChars * _options.CharacterWidth);
        textColumnWidth = Math.Min(textColumnMaxWidth, textColumnWidth);
        double width = Math.Clamp(
            _options.NodePaddingX
                + privateEndpointIndicatorWidth
                + _options.PictogramSize
                + _options.IconToLabelGap
                + textColumnWidth
                + _options.NodePaddingX,
            _options.MinNodeWidth,
            _options.MaxNodeWidth);
        int textLineCount = nameLines.Count + resourceGroupLines.Count;
        double textBlockHeight = textLineCount * _options.LineHeight;
        double height = (_options.NodePaddingY * 2)
            + Math.Max(_options.PictogramSize, textBlockHeight);

        return new DiagramForestNodeMetrics(
            Width: width,
            Height: height,
            NameLines: nameLines,
            ResourceGroupLines: resourceGroupLines,
            Caption: caption,
            PictogramKind: DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType),
            AzureIcon: _iconCatalog.Resolve(node.ArmResourceType, node.ArmResourceKind),
            HasPrivateEndpointAccess: node.HasPrivateEndpointAccess,
            SuppressResourceGroupCaption: suppressResourceGroupCaption);
    }
}
