using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>
/// Collapses a leaf inventory graph to one topology node per resource group so Full subscription
/// can stay under IE-17 readability thresholds.
/// </summary>
internal static class InventoryDiagramResourceGroupMapBuilder
{
    public const string CollapseKind = "ResourceGroupMap";
    public const string ArmResourceType = "Microsoft.Resources/resourceGroups";
    public const string ViewMarker = "al-view=resource-group-map";
    public const string TitleSuffix = DiagramAstFromGraphCompilerConstants.ResourceGroupMapTitleSuffix;
    public const string Caption =
        "This diagram shows one node per resource group, not every Azure resource. Pick a Resource Group to see resources inside a group.";

    public static bool TryBuild(GraphSnapshot graph, int maxMapNodes, out GraphSnapshot collapsed)
    {
        ArgumentNullException.ThrowIfNull(graph);

        collapsed = graph;

        if (maxMapNodes < 1)
        {
            return false;
        }

        List<GraphNode> topologyNodes = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .ToList();

        Dictionary<string, InventoryDiagramResourceGroupBucket> buckets = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in topologyNodes)
        {
            string? resourceGroup = DiagramAstGraphNodeClassifier.ReadResourceGroup(node);

            if (string.IsNullOrWhiteSpace(resourceGroup))
            {
                continue;
            }

            string trimmedGroup = resourceGroup.Trim();

            if (!buckets.TryGetValue(trimmedGroup, out InventoryDiagramResourceGroupBucket? bucket))
            {
                bucket = new InventoryDiagramResourceGroupBucket(
                    trimmedGroup,
                    DiagramAstGraphNodeClassifier.ReadSubscriptionId(node));
                buckets[trimmedGroup] = bucket;
            }

            bucket.ResourceCount++;
        }

        if (buckets.Count < 2 || buckets.Count > maxMapNodes)
        {
            return false;
        }

        Dictionary<string, GraphNode> nodesById = new(StringComparer.OrdinalIgnoreCase);
        List<GraphNode> mapNodes = [];

        foreach (InventoryDiagramResourceGroupBucket bucket in buckets.Values.OrderBy(
                     candidate => candidate.Name,
                     StringComparer.Ordinal))
        {
            GraphNode mapNode = CreateResourceGroupNode(bucket);
            mapNodes.Add(mapNode);
            nodesById[bucket.Name] = mapNode;
        }

        HashSet<string> seenEdges = new(StringComparer.OrdinalIgnoreCase);
        List<GraphEdge> mapEdges = [];

        // Collapse leaf-to-leaf edges onto one RG-to-RG edge per directed pair so the map stays small.
        Dictionary<string, string?> nodeGroupById = topologyNodes.ToDictionary(
            node => node.NodeId,
            DiagramAstGraphNodeClassifier.ReadResourceGroup,
            StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!nodeGroupById.TryGetValue(edge.FromNodeId, out string? fromGroup)
                || !nodeGroupById.TryGetValue(edge.ToNodeId, out string? toGroup)
                || string.IsNullOrWhiteSpace(fromGroup)
                || string.IsNullOrWhiteSpace(toGroup)
                || string.Equals(fromGroup, toGroup, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string edgeKey = $"{fromGroup}\u001f{toGroup}";

            if (!seenEdges.Add(edgeKey))
            {
                continue;
            }

            if (!nodesById.TryGetValue(fromGroup, out GraphNode? fromNode)
                || !nodesById.TryGetValue(toGroup, out GraphNode? toNode))
            {
                continue;
            }

            mapEdges.Add(new GraphEdge
            {
                EdgeId = $"rg-map-edge:{fromGroup}:{toGroup}",
                FromNodeId = fromNode.NodeId,
                ToNodeId = toNode.NodeId,
                EdgeType = GraphEdgeTypes.RelatesTo,
                Weight = 1.0d,
            });
        }

        collapsed = new GraphSnapshot
        {
            SchemaVersion = graph.SchemaVersion,
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = mapNodes,
            Edges = mapEdges,
            Warnings = graph.Warnings,
        };

        return true;
    }

    public static bool TitleMarksResourceGroupMap(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return false;
        }

        return title.Contains(TitleSuffix, StringComparison.OrdinalIgnoreCase);
    }

    private static GraphNode CreateResourceGroupNode(InventoryDiagramResourceGroupBucket bucket)
    {
        string subscriptionId = string.IsNullOrWhiteSpace(bucket.SubscriptionId)
            ? "unknown"
            : bucket.SubscriptionId.Trim();
        string armId = $"/subscriptions/{subscriptionId}/resourceGroups/{bucket.Name}";
        string nodeId = $"rg-map:{bucket.Name}";
        string resourceWord = bucket.ResourceCount == 1 ? "resource" : "resources";

        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = $"{bucket.Name} ({bucket.ResourceCount} {resourceWord})",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
        };

        node.Properties["arm.id"] = armId;
        node.Properties["arm.type"] = ArmResourceType;
        node.Properties["arm.resourceGroup"] = bucket.Name;
        node.Properties["arm.subscriptionId"] = subscriptionId;

        return node;
    }
}
