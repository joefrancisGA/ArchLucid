using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Diagram-wide peer labels used to keep truncated canvas text correlatable.</summary>
public sealed class DiagramForestCanvasLabelContext
{
    private readonly IReadOnlyList<string> _peerResourceNames;
    private readonly IReadOnlyList<string> _peerResourceGroupNames;
    private readonly DiagramForestLayoutOptions _options;
    private readonly HashSet<string> _suppressResourceGroupCaptionNodeIds;
    private readonly IReadOnlyDictionary<string, string> _consumerStatusByNodeId;

    private DiagramForestCanvasLabelContext(
        IReadOnlyList<string> peerResourceNames,
        IReadOnlyList<string> peerResourceGroupNames,
        DiagramForestLayoutOptions options,
        HashSet<string> suppressResourceGroupCaptionNodeIds,
        IReadOnlyDictionary<string, string> consumerStatusByNodeId)
    {
        _peerResourceNames = peerResourceNames;
        _peerResourceGroupNames = peerResourceGroupNames;
        _options = options;
        _suppressResourceGroupCaptionNodeIds = suppressResourceGroupCaptionNodeIds;
        _consumerStatusByNodeId = consumerStatusByNodeId;
    }

    public static DiagramForestCanvasLabelContext Create(
        IReadOnlyList<DiagramNode> nodes,
        DiagramForestLayoutOptions options,
        IReadOnlyList<DiagramEdge>? visibleEdges = null,
        bool isDataFlow = false)
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
        IReadOnlyDictionary<string, string> consumerStatusByNodeId =
            isDataFlow
                ? BuildConsumerStatusByNodeId(nodes, visibleEdges ?? [])
                : new Dictionary<string, string>(StringComparer.Ordinal);

        return new DiagramForestCanvasLabelContext(
            peerResourceNames,
            peerResourceGroupNames,
            options,
            suppressResourceGroupCaptionNodeIds,
            consumerStatusByNodeId);
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
        _consumerStatusByNodeId.TryGetValue(node.NodeId, out string? consumerStatusLine);
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
        longestLineChars = Math.Max(longestLineChars, consumerStatusLine?.Length ?? 0);
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
        int textLineCount = nameLines.Count
            + (consumerStatusLine is null ? 0 : 1)
            + resourceGroupLines.Count;
        double textBlockHeight = textLineCount * _options.LineHeight;
        double height = (_options.NodePaddingY * 2)
            + Math.Max(_options.PictogramSize, textBlockHeight);

        return new DiagramForestNodeMetrics(
            Width: width,
            Height: height,
            NameLines: nameLines,
            ConsumerStatusLine: consumerStatusLine,
            ResourceGroupLines: resourceGroupLines,
            Caption: caption,
            PictogramKind: DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType),
            AzureIcon: DiagramInventoryAzureIconResolver.Resolve(node),
            HasPrivateEndpointAccess: node.HasPrivateEndpointAccess,
            SuppressResourceGroupCaption: suppressResourceGroupCaption);
    }

    private static IReadOnlyDictionary<string, string> BuildConsumerStatusByNodeId(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        HashSet<string> visibleNodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, HashSet<string>> consumerIdsByNodeId = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (edge.IsLayoutOnly
                || !visibleNodeIds.Contains(edge.FromNodeId)
                || !visibleNodeIds.Contains(edge.ToNodeId)
                || string.Equals(edge.FromNodeId, edge.ToNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            AddConsumer(consumerIdsByNodeId, edge.FromNodeId, edge.ToNodeId);
            AddConsumer(consumerIdsByNodeId, edge.ToNodeId, edge.FromNodeId);
        }

        Dictionary<string, string> result = new(StringComparer.Ordinal);

        foreach (DiagramNode node in nodes)
        {
            if (!IsConsumerStatusResource(node.ArmResourceType))
            {
                continue;
            }

            int count = consumerIdsByNodeId.TryGetValue(node.NodeId, out HashSet<string>? consumerIds)
                ? consumerIds.Count
                : 0;
            result[node.NodeId] = count == 0
                ? "No consumer found"
                : $"Used by {count}";
        }

        return result;
    }

    private static void AddConsumer(
        Dictionary<string, HashSet<string>> consumerIdsByNodeId,
        string nodeId,
        string consumerId)
    {
        if (!consumerIdsByNodeId.TryGetValue(nodeId, out HashSet<string>? consumerIds))
        {
            consumerIds = new HashSet<string>(StringComparer.Ordinal);
            consumerIdsByNodeId[nodeId] = consumerIds;
        }

        consumerIds.Add(consumerId);
    }

    private static bool IsConsumerStatusResource(string? armResourceType)
    {
        return armResourceType is not null
            && (armResourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/servers/databases", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Sql/managedInstances", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforMySQL/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforMySQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforPostgreSQL/servers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DBforPostgreSQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Cache/Redis", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Equals("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase));
    }
}
