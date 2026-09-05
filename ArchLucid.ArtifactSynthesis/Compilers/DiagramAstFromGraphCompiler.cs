using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

public sealed class DiagramAstFromGraphCompiler : IDiagramAstFromGraphCompiler
{
    private readonly DiagramSubgraphPlanner subgraphPlanner = new();

    public DiagramAst Compile(GraphSnapshot graph, DiagramMode mode, DiagramAstCompileOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(graph);

        options ??= new DiagramAstCompileOptions();

        List<GraphNode> topologyNodes = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();

        topologyNodes = ApplyModeNodeFilter(graph, topologyNodes, mode, options);

        HashSet<string> includedNodeIds = topologyNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> includedEdges = graph.Edges
            .Where(edge => edge.Weight >= DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            .Where(edge => includedNodeIds.Contains(edge.FromNodeId) && includedNodeIds.Contains(edge.ToNodeId))
            .OrderBy(edge => edge.EdgeId, StringComparer.Ordinal)
            .ToList();

        IReadOnlyList<DiagramSubgraph> subgraphs = subgraphPlanner.PlanSubgraphs(topologyNodes);

        DiagramAst ast = new()
        {
            Title = BuildTitle(mode, options),
            Subgraphs = subgraphs.ToList(),
        };

        int order = 0;

        foreach (GraphNode node in topologyNodes)
        {
            string mermaidNodeId = MermaidIdSanitizer.Sanitize(node.NodeId);

            ast.Nodes.Add(new DiagramNode
            {
                NodeId = mermaidNodeId,
                Label = node.Label,
                NodeType = node.NodeType,
                SubgraphId = subgraphPlanner.ResolveSubgraphId(node, subgraphs),
                OrderKey = order++,
            });
        }

        Dictionary<string, string> nodeIdMap = topologyNodes.ToDictionary(
            node => node.NodeId,
            node => MermaidIdSanitizer.Sanitize(node.NodeId),
            StringComparer.Ordinal);

        foreach (GraphEdge edge in includedEdges)
        {
            if (!nodeIdMap.TryGetValue(edge.FromNodeId, out string? fromId)
                || !nodeIdMap.TryGetValue(edge.ToNodeId, out string? toId))
            {
                continue;
            }

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = fromId,
                ToNodeId = toId,
                Label = string.IsNullOrWhiteSpace(edge.Label) ? edge.EdgeType : edge.Label!,
            });
        }

        return ast;
    }

    private static string BuildTitle(DiagramMode mode, DiagramAstCompileOptions options)
    {
        if (mode == DiagramMode.ResourceGroup && !string.IsNullOrWhiteSpace(options.ResourceGroupName))
        {
            return $"Azure inventory ({mode}) — {options.ResourceGroupName}";
        }

        return $"Azure inventory ({mode})";
    }

    private static List<GraphNode> ApplyModeNodeFilter(
        GraphSnapshot graph,
        List<GraphNode> nodes,
        DiagramMode mode,
        DiagramAstCompileOptions options)
    {
        switch (mode)
        {
            case DiagramMode.Executive:
                return ApplyExecutiveFilter(nodes);
            case DiagramMode.Architecture:
                return FilterByCategories(
                    nodes,
                    GraphTopologyCategories.Compute,
                    GraphTopologyCategories.Network,
                    GraphTopologyCategories.Storage);
            case DiagramMode.Network:
                return FilterByCategories(nodes, GraphTopologyCategories.Network);
            case DiagramMode.Security:
                return FilterSecurityNodes(nodes);
            case DiagramMode.Identity:
                return FilterByCategories(nodes, GraphTopologyCategories.Identity);
            case DiagramMode.Data:
                return FilterByCategories(nodes, GraphTopologyCategories.Data, GraphTopologyCategories.Storage);
            case DiagramMode.FullSubscription:
                return nodes;
            case DiagramMode.ResourceGroup:
                return FilterByResourceGroup(nodes, options.ResourceGroupName);
            case DiagramMode.SelectedResources:
                return FilterBySelectedNodes(nodes, options.SelectedNodeIds);
            case DiagramMode.DependencyNeighborhood:
                return FilterByNeighborhood(graph, nodes, options);
            default:
                throw new ArgumentOutOfRangeException(nameof(mode), mode, "Unsupported diagram mode.");
        }
    }

    private static List<GraphNode> ApplyExecutiveFilter(List<GraphNode> nodes)
    {
        List<GraphNode> summaryNodes = nodes
            .Where(DiagramAstGraphNodeClassifier.IsExecutiveSummaryNode)
            .ToList();

        if (summaryNodes.Count == 0)
        {
            summaryNodes = nodes
                .Take(DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes)
                .ToList();
        }

        return summaryNodes
            .Take(DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes)
            .ToList();
    }

    private static List<GraphNode> FilterByCategories(List<GraphNode> nodes, params string[] categories)
    {
        HashSet<string> allowed = categories.ToHashSet(StringComparer.Ordinal);

        return nodes
            .Where(node => allowed.Contains(DiagramAstGraphNodeClassifier.ResolveCategory(node)))
            .ToList();
    }

    private static List<GraphNode> FilterSecurityNodes(List<GraphNode> nodes)
    {
        return nodes
            .Where(node =>
            {
                string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

                return armType.Contains("networksecuritygroups", StringComparison.OrdinalIgnoreCase)
                    || armType.Contains("firewalls", StringComparison.OrdinalIgnoreCase)
                    || armType.Contains("frontdoors", StringComparison.OrdinalIgnoreCase)
                    || armType.Contains("applicationgateways", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(
                        DiagramAstGraphNodeClassifier.ResolveCategory(node),
                        GraphTopologyCategories.Network,
                        StringComparison.Ordinal);
            })
            .ToList();
    }

    private static List<GraphNode> FilterByResourceGroup(List<GraphNode> nodes, string? resourceGroupName)
    {
        if (string.IsNullOrWhiteSpace(resourceGroupName))
        {
            return [];
        }

        return nodes
            .Where(node => string.Equals(
                DiagramAstGraphNodeClassifier.ReadResourceGroup(node),
                resourceGroupName,
                StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private static List<GraphNode> FilterBySelectedNodes(List<GraphNode> nodes, IReadOnlyList<string>? selectedNodeIds)
    {
        if (selectedNodeIds is null || selectedNodeIds.Count == 0)
        {
            return [];
        }

        HashSet<string> selected = selectedNodeIds.ToHashSet(StringComparer.Ordinal);

        return nodes
            .Where(node => selected.Contains(node.NodeId))
            .ToList();
    }

    private static List<GraphNode> FilterByNeighborhood(
        GraphSnapshot graph,
        List<GraphNode> nodes,
        DiagramAstCompileOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.NeighborhoodSeedNodeId))
        {
            return [];
        }

        HashSet<string> nodeIds = nodes.Select(node => node.NodeId).ToHashSet(StringComparer.Ordinal);
        Dictionary<string, List<string>> adjacency = nodeIds.ToDictionary(
            nodeId => nodeId,
            _ => new List<string>(),
            StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!adjacency.ContainsKey(edge.FromNodeId) || !adjacency.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            adjacency[edge.FromNodeId].Add(edge.ToNodeId);
            adjacency[edge.ToNodeId].Add(edge.FromNodeId);
        }

        foreach (GraphNode node in nodes)
        {
            if (node.Properties.TryGetValue("arm.parentId", out string? parentId)
                && !string.IsNullOrWhiteSpace(parentId)
                && adjacency.ContainsKey(parentId))
            {
                adjacency[parentId].Add(node.NodeId);
                adjacency[node.NodeId].Add(parentId);
            }
        }

        HashSet<string> visited = new(StringComparer.Ordinal);
        Queue<(string NodeId, int Depth)> queue = new();
        queue.Enqueue((options.NeighborhoodSeedNodeId, 0));
        visited.Add(options.NeighborhoodSeedNodeId);

        while (queue.Count > 0)
        {
            (string nodeId, int depth) = queue.Dequeue();

            if (depth >= options.NeighborhoodDepth)
            {
                continue;
            }

            if (!adjacency.TryGetValue(nodeId, out List<string>? neighbors))
            {
                continue;
            }

            foreach (string neighbor in neighbors)
            {
                if (visited.Add(neighbor))
                {
                    queue.Enqueue((neighbor, depth + 1));
                }
            }
        }

        return nodes
            .Where(node => visited.Contains(node.NodeId))
            .ToList();
    }
}
