using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

public sealed class DiagramAstFromGraphCompiler : IDiagramAstFromGraphCompiler
{
    private readonly DiagramSubgraphPlanner subgraphPlanner = new();

    public DiagramAst Compile(GraphSnapshot graph, DiagramMode mode, DiagramAstCompileOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(graph);

        options ??= new DiagramAstCompileOptions();

        bool isDataFlowMode = mode == DiagramMode.DataFlow;
        bool isDataArchitectureMode = mode == DiagramMode.DataArchitecture;
        bool isSecureNowDataMode = isDataFlowMode || isDataArchitectureMode;

        List<GraphNode> allTopologyNodes = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();

        List<GraphNode> topologyNodes = ApplyModeNodeFilter(graph, allTopologyNodes.ToList(), mode, options);

        if (isDataFlowMode)
        {
            topologyNodes = DataFlowEvidenceEndpointIncluder.Include(graph, topologyNodes);
        }
        else if (!isSecureNowDataMode)
        {
            topologyNodes = ExecutiveVnetPeeringEndpointIncluder.Include(graph, topologyNodes, mode);
            topologyNodes = InventoryConnectionEndpointIncluder.Include(graph, topologyNodes, mode);
        }

        HashSet<string> includedNodeIds = topologyNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> includedEdges = graph.Edges
            .Where(edge => edge.Weight >= DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            .Where(edge => includedNodeIds.Contains(edge.FromNodeId) && includedNodeIds.Contains(edge.ToNodeId))
            .OrderBy(edge => edge.EdgeId, StringComparer.Ordinal)
            .ToList();

        if (isDataFlowMode)
        {
            includedEdges = includedEdges
                .Where(DiagramDataFlowEdgeFilter.IncludeEdge)
                .ToList();
        }
        else if (isDataArchitectureMode)
        {
            includedEdges = includedEdges
                .Where(IsDataArchitectureEdge)
                .ToList();
        }

        IReadOnlyList<DiagramSubgraph> subgraphs = isDataFlowMode
            ? DiagramDataFlowStageSubgraphPlanner.PlanSubgraphs(topologyNodes)
            : isDataArchitectureMode
                ? DiagramDataArchitectureTypeGroupPlanner.PlanSubgraphs(topologyNodes)
                : subgraphPlanner.PlanSubgraphs(topologyNodes);

        DiagramAst ast = new()
        {
            Title = BuildTitle(mode, options),
            Subgraphs = subgraphs.ToList(),
        };

        int order = 0;
        Dictionary<string, string> nodeIdMap = new(StringComparer.Ordinal);
        HashSet<string> seenTopologyNodeIds = new(StringComparer.Ordinal);

        foreach (GraphNode node in topologyNodes)
        {
            if (!seenTopologyNodeIds.Add(node.NodeId))
            {
                continue;
            }

            string mermaidNodeId = MermaidIdSanitizer.Sanitize(node.NodeId);
            nodeIdMap[node.NodeId] = mermaidNodeId;

            ast.Nodes.Add(BuildDiagramNode(node, mermaidNodeId, subgraphs, mode, order++));
        }

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
                Label = DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                    edge.Label,
                    edge.EdgeType,
                    edge.InferenceSource),
                ProvenanceKind = edge.ProvenanceKind,
                InferenceSource = edge.InferenceSource,
                DeclaredConnectionId = edge.DeclaredConnectionId,
            });
        }

        DiagramAstSubgraphPruner.PruneUnusedSubgraphs(ast);

        if (mode == DiagramMode.Executive)
        {
            DiagramExecutiveRegionPlanner.ApplyRegionSubgraphs(ast, topologyNodes);
            ExecutiveVnetSummaryBuilder.ApplyExecutiveVnetLabels(ast, graph, topologyNodes);
            ExecutiveVnetPeeringEdgeBuilder.Apply(ast, graph, topologyNodes, nodeIdMap);
        }

        DiagramAstExecutiveLayoutSimplifier.FlattenSparseSubgraphs(ast, mode, options);

        if (mode is not DiagramMode.Network && !isSecureNowDataMode)
        {
            HashSet<string> privateEndpointDiagramNodeIdsToHide = DiagramPrivateEndpointTargetAnnotator.Apply(
                ast,
                graph.Nodes,
                graph.Edges,
                nodeIdMap);
            DiagramPrivateEndpointCanvasPruner.RemoveNodes(ast, privateEndpointDiagramNodeIdsToHide);
        }

        if (DiagramNicCollapseApplier.ShouldCollapseNetworkInterfaces(mode))
        {
            DiagramNicCollapseApplier.Apply(ast, graph, nodeIdMap);
        }

        DiagramAstSubgraphPruner.PruneUnusedSubgraphs(ast);

        if (!isSecureNowDataMode)
        {
            DiagramAstLayoutEdgeBuilder.AddDerivedVmVnetLayoutEdges(ast, graph, mode, nodeIdMap);
        }

        DiagramAstLayoutEdgeBuilder.EnsureLayoutEdgesWhenEmpty(ast);
        DiagramSparseComponentPacker.Pack(ast);
        DiagramEdgeLabelHumanizer.ApplyToVisibleEdges(ast);
        DiagramEdgeProvenanceDisplayLabelApplier.ApplyToVisibleEdges(ast);
        DiagramConnectionTypeAnnotator.Annotate(ast);

        if (isDataFlowMode)
        {
            ast.FlowchartDirection = "LR";
            ast.CaptionLines = DiagramDataFlowCaptionBuilder.BuildCaptions(topologyNodes, includedEdges).ToList();
        }
        else if (isDataArchitectureMode)
        {
            ast.CaptionLines =
            [
                DiagramDataArchitectureHonestyLegend.PrimarySentence,
            ];
        }

        return ast;
    }

    private DiagramNode BuildDiagramNode(
        GraphNode node,
        string mermaidNodeId,
        IReadOnlyList<DiagramSubgraph> subgraphs,
        DiagramMode mode,
        int orderKey)
    {
        // Rollup nodes ("+N more databases") are not real resources: no seed, so the outline
        // does not offer Focus neighborhood on them, and no ARM metadata to humanize.
        bool isOverflow = DiagramExecutiveAlwaysShowSelector.IsOverflowNode(node);

        string? subgraphId = mode switch
        {
            DiagramMode.DataFlow => DiagramDataFlowStageSubgraphPlanner.ResolveSubgraphId(node, subgraphs),
            DiagramMode.DataArchitecture => DiagramDataArchitectureTypeGroupPlanner.ResolveSubgraphId(node, subgraphs),
            _ => subgraphPlanner.ResolveSubgraphId(node, subgraphs),
        };

        return new DiagramNode
        {
            NodeId = mermaidNodeId,
            Label = node.Label,
            NodeType = node.NodeType,
            SubgraphId = subgraphId,
            OrderKey = orderKey,
            CloudResourceId = isOverflow ? null : DiagramAstGraphNodeClassifier.ReadCloudResourceId(node),
            SeedNodeId = isOverflow ? null : node.NodeId,
            ArmResourceType = isOverflow ? null : DiagramAstGraphNodeClassifier.ReadArmType(node),
            ArmResourceGroup = isOverflow ? null : DiagramAstGraphNodeClassifier.ReadResourceGroup(node),
            IsExecutiveOverflow = isOverflow,
        };
    }

    private static string BuildTitle(DiagramMode mode, DiagramAstCompileOptions options)
    {
        if (mode == DiagramMode.ResourceGroup && !string.IsNullOrWhiteSpace(options.ResourceGroupName))
        {
            return $"Azure inventory ({mode}) — {options.ResourceGroupName}";
        }

        if (mode == DiagramMode.FullSubscription && options.CollapseToResourceGroupMap)
        {
            return $"Azure inventory ({mode}) — {DiagramAstFromGraphCompilerConstants.ResourceGroupMapTitleSuffix}";
        }

        if (mode == DiagramMode.FullSubscription && options.CollapseToBackboneKeep)
        {
            return $"Azure inventory ({mode}) — {DiagramAstFromGraphCompilerConstants.BackboneKeepTitleSuffix}";
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
                return ApplyNetworkInterfaceCollapse(
                    graph,
                    mode,
                    NetworkDiagramNodeFilter.ExcludeNetworkInterfaces(
                        ApplyExecutiveFilter(nodes, options)));
            case DiagramMode.Architecture:
                return ApplyNetworkInterfaceCollapse(
                    graph,
                    mode,
                    NetworkDiagramNodeFilter.ExcludeNetworkInterfaces(
                        FilterByCategories(
                            nodes,
                            GraphTopologyCategories.Compute,
                            GraphTopologyCategories.Network,
                            GraphTopologyCategories.Storage)));
            case DiagramMode.Network:
                return ApplyNetworkInterfaceCollapse(
                    graph,
                    mode,
                    DiagramNicCollapseApplier.IncludeVirtualMachinesAttachedToNetworkInterfaces(
                        graph,
                        IncludeInventoryConnectedVirtualMachines(
                            graph,
                            NetworkDiagramNodeFilter.ExcludeNetworkInterfaces(
                                NetworkDiagramNodeFilter.ExcludePrivateEndpoints(
                                    FilterByCategories(nodes, GraphTopologyCategories.Network))))));
            case DiagramMode.Security:
                return ApplyNetworkInterfaceCollapse(
                    graph,
                    mode,
                    NetworkDiagramNodeFilter.ExcludeNetworkInterfaces(FilterSecurityNodes(nodes)));
            case DiagramMode.Identity:
                return FilterByCategories(nodes, GraphTopologyCategories.Identity);
            case DiagramMode.Data:
                return ExcludeExternalSourceNodes(
                    FilterByCategories(nodes, GraphTopologyCategories.Data, GraphTopologyCategories.Storage));
            case DiagramMode.DataFlow:
                return ApplyDataFlowFilter(nodes);
            case DiagramMode.DataArchitecture:
                return ApplyDataArchitectureFilter(nodes);
            case DiagramMode.FullSubscription:
                return ApplyNetworkInterfaceCollapse(
                    graph,
                    mode,
                    NetworkDiagramNodeFilter.ExcludeNetworkInterfaces(
                        ExcludeExternalSourceNodes(
                            NetworkDiagramNodeFilter.ExcludePrivateEndpoints(nodes))));
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

    /// <summary>
    /// Executive = all VNet / subscription / RG summary nodes followed by the always-show tiers (IDL-06).
    /// Tier order is preserved so the flat grid reads workloads → databases → storage → data factories.
    /// </summary>
    private static List<GraphNode> ApplyNetworkInterfaceCollapse(
        GraphSnapshot graph,
        DiagramMode mode,
        List<GraphNode> nodes)
    {
        if (!DiagramNicCollapseApplier.ShouldCollapseNetworkInterfaces(mode))
        {
            return nodes;
        }

        return DiagramNicCollapseApplier.IncludePublicIpsExposingVisibleOwners(graph, nodes);
    }

    private static List<GraphNode> ApplyExecutiveFilter(List<GraphNode> nodes, DiagramAstCompileOptions options)
    {
        List<GraphNode> summaryNodes = nodes
            .Where(DiagramAstGraphNodeClassifier.IsExecutiveSummaryNode)
            .ToList();

        List<GraphNode> alwaysShowNodes = DiagramExecutiveAlwaysShowSelector.Select(nodes, options.HiddenExecutiveTierKeys);

        if (summaryNodes.Count == 0 && alwaysShowNodes.Count == 0)
        {
            // Snapshot has neither VNets nor tiered resources — show something rather than an empty canvas.
            return nodes
                .Take(DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes)
                .ToList();
        }

        return summaryNodes
            .Concat(alwaysShowNodes)
            .ToList();
    }

    private static List<GraphNode> IncludeInventoryConnectedVirtualMachines(
        GraphSnapshot graph,
        List<GraphNode> nodes)
    {
        HashSet<string> includedNodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        Dictionary<string, GraphNode> nodesById = graph.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!edge.EdgeType.Equals(GraphEdgeTypes.ConnectsTo, StringComparison.Ordinal))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode)
                || !nodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode))
            {
                continue;
            }

            if (includedNodeIds.Contains(edge.FromNodeId) && IsVirtualMachineNode(toNode))
            {
                nodes.Add(toNode);
                includedNodeIds.Add(toNode.NodeId);
            }

            if (includedNodeIds.Contains(edge.ToNodeId) && IsVirtualMachineNode(fromNode))
            {
                nodes.Add(fromNode);
                includedNodeIds.Add(fromNode.NodeId);
            }
        }

        return nodes
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();
    }

    private static bool IsVirtualMachineNode(GraphNode node)
    {
        return DiagramAstGraphNodeClassifier.ReadArmType(node)
            .Contains("virtualMachines", StringComparison.OrdinalIgnoreCase);
    }

    private static List<GraphNode> FilterByCategories(List<GraphNode> nodes, params string[] categories)
    {
        HashSet<string> allowed = categories.ToHashSet(StringComparer.OrdinalIgnoreCase);

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
        string? resolvedSeedNodeId = DiagramNeighborhoodSeedResolver.TryResolveGraphNodeId(
            nodes,
            options.NeighborhoodSeedNodeId);

        if (string.IsNullOrWhiteSpace(resolvedSeedNodeId))
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

        AddParentInventoryAdjacency(nodes, adjacency);

        HashSet<string> visited = new(StringComparer.Ordinal);
        Queue<(string NodeId, int Depth)> queue = new();
        queue.Enqueue((resolvedSeedNodeId, 0));
        visited.Add(resolvedSeedNodeId);

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

    private static void AddParentInventoryAdjacency(
        List<GraphNode> nodes,
        Dictionary<string, List<string>> adjacency)
    {
        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

            if (string.IsNullOrWhiteSpace(armId) || nodeIdByArmId.ContainsKey(armId))
            {
                continue;
            }

            nodeIdByArmId[armId] = node.NodeId;
        }

        foreach (GraphNode node in nodes)
        {
            if (node.Properties == null
                || !node.Properties.TryGetValue("arm.parentId", out string? parentId)
                || string.IsNullOrWhiteSpace(parentId))
            {
                continue;
            }

            if (!nodeIdByArmId.TryGetValue(parentId, out string? parentNodeId))
            {
                continue;
            }

            if (!adjacency.ContainsKey(parentNodeId) || !adjacency.ContainsKey(node.NodeId))
            {
                continue;
            }

            adjacency[parentNodeId].Add(node.NodeId);
            adjacency[node.NodeId].Add(parentNodeId);
        }
    }

    private static List<GraphNode> ApplyDataFlowFilter(List<GraphNode> nodes)
    {
        return nodes
            .Where(node => InventoryDataFlowStageResolver.Resolve(node) is not null)
            .ToList();
    }

    private static List<GraphNode> ApplyDataArchitectureFilter(List<GraphNode> nodes)
    {
        return nodes
            .Where(InventoryDataFlowStageResolver.IsDataArchitectureNode)
            .ToList();
    }

    private static List<GraphNode> ExcludeExternalSourceNodes(List<GraphNode> nodes)
    {
        return nodes
            .Where(node => !DiagramAstGraphNodeClassifier.IsExternalSourceNode(node))
            .ToList();
    }

    private static bool IsDataArchitectureEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        return string.Equals(edge.EdgeType, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase);
    }
}
