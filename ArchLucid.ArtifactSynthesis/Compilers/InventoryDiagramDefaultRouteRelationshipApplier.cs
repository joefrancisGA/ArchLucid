using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Projects default routes as Routed through lines and other routes as outline sentences (NR-23).</summary>
internal static class InventoryDiagramDefaultRouteRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(ast, graphToDiagramNodeId, graphNodesById);
        Dictionary<string, string> nicArmIdToOwnerArmId = BuildNicOwnerArmIdMap(graph);
        Dictionary<string, HashSet<string>> workloadArmIdsBySubnetArmId = BuildSubnetWorkloadArmIdMap(graph, nicArmIdToOwnerArmId);

        foreach (GraphNode routeTableNode in graph.Nodes)
        {
            if (!IsRouteTableNode(routeTableNode))
            {
                continue;
            }

            IReadOnlyList<string> subnetArmIds = AzureInventoryRouteTableSubnetAssociationParser.Parse(routeTableNode.Properties);
            IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(routeTableNode.Properties);

            foreach (string subnetArmId in subnetArmIds)
            {
                if (!workloadArmIdsBySubnetArmId.TryGetValue(
                        ArmResourceIdNormalizer.Normalize(subnetArmId),
                        out HashSet<string>? workloadArmIds))
                {
                    continue;
                }

                foreach (string workloadArmId in workloadArmIds)
                {
                    if (!armIdToDiagramNodeId.TryGetValue(workloadArmId, out string? workloadDiagramNodeId))
                    {
                        continue;
                    }

                    DiagramNode? workloadDiagramNode = ast.Nodes.FirstOrDefault(node =>
                        string.Equals(node.NodeId, workloadDiagramNodeId, StringComparison.Ordinal));

                    if (workloadDiagramNode is null)
                    {
                        continue;
                    }

                    foreach (AzureInventoryRouteTableRoute route in routes)
                    {
                        ApplyRoute(ast, graph.Nodes, route, workloadDiagramNode, armIdToDiagramNodeId, graphNodesById);
                    }
                }
            }
        }
    }

    private static void ApplyRoute(
        DiagramAst ast,
        IReadOnlyList<GraphNode> topologyNodes,
        AzureInventoryRouteTableRoute route,
        DiagramNode workloadDiagramNode,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        string addressPrefix = route.AddressPrefix?.Trim() ?? string.Empty;
        string? nextHopArmId = AzureInventoryRouteTableNextHopResolver.Resolve(route, topologyNodes);
        GraphNode? nextHopNode = null;

        if (!string.IsNullOrWhiteSpace(nextHopArmId))
        {
            nextHopNode = graphNodesById.Values.FirstOrDefault(node =>
                string.Equals(
                    ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node)),
                    ArmResourceIdNormalizer.Normalize(nextHopArmId),
                    StringComparison.OrdinalIgnoreCase));
        }

        string? nextHopName = nextHopNode is null
            ? null
            : ReadResourceName(DiagramAstGraphNodeClassifier.ReadArmId(nextHopNode), nextHopNode.Label);

        if (addressPrefix.Equals("0.0.0.0/0", StringComparison.Ordinal)
            && AzureInventoryRouteTableRoutedThroughNextHopClassifier.IsEligibleNextHop(nextHopNode)
            && !string.IsNullOrWhiteSpace(nextHopArmId)
            && armIdToDiagramNodeId.TryGetValue(ArmResourceIdNormalizer.Normalize(nextHopArmId), out string? nextHopDiagramNodeId))
        {
            InventoryDiagramRelationshipEdgeHelper.RemoveGenericEdgesBetween(
                ast,
                workloadDiagramNode.NodeId,
                nextHopDiagramNodeId);
            string edgeLabel = string.IsNullOrWhiteSpace(nextHopName)
                ? "Routed through next hop (name was not stored)"
                : InventoryDiagramRelationshipLabelTexts.FormatRoutedThrough(nextHopName);

            InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                ast,
                workloadDiagramNode.NodeId,
                nextHopDiagramNodeId,
                edgeLabel,
                GraphEdgeInferenceSources.InventoryEffectiveRoutes,
                ProvenanceKind.ObservedFact.ToString());

            return;
        }

        string? outlineSentence = InventoryDiagramRouteOutlineSentenceFormatter.TryFormat(route, nextHopName);

        if (string.IsNullOrWhiteSpace(outlineSentence))
        {
            return;
        }

        if (!workloadDiagramNode.UnresolvedRelationshipDetails.Contains(outlineSentence, StringComparer.Ordinal))
        {
            workloadDiagramNode.UnresolvedRelationshipDetails.Add(outlineSentence);
        }
    }

    private static bool IsRouteTableNode(GraphNode node)
    {
        return string.Equals(
            DiagramAstGraphNodeClassifier.ReadArmType(node),
            "Microsoft.Network/routeTables",
            StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, HashSet<string>> BuildSubnetWorkloadArmIdMap(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        Dictionary<string, HashSet<string>> workloadArmIdsBySubnetArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? source)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? subnetOrVnet))
            {
                continue;
            }

            string sourceArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(source));
            string targetArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(subnetOrVnet));

            if (DiagramAstGraphNodeClassifier.ReadArmType(source)
                    .Contains("/networkInterfaces", StringComparison.OrdinalIgnoreCase)
                && nicArmIdToOwnerArmId.TryGetValue(sourceArmId, out string? ownerArmId))
            {
                sourceArmId = ownerArmId;
            }

            if (!workloadArmIdsBySubnetArmId.TryGetValue(targetArmId, out HashSet<string>? owners))
            {
                owners = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                workloadArmIdsBySubnetArmId[targetArmId] = owners;
            }

            owners.Add(sourceArmId);
        }

        return workloadArmIdsBySubnetArmId;
    }

    private static Dictionary<string, string> BuildArmIdToDiagramNodeId(
        DiagramAst ast,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> armIdToDiagramNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.ArmResourceId))
            {
                continue;
            }

            armIdToDiagramNodeId[ArmResourceIdNormalizer.Normalize(diagramNode.ArmResourceId)] = diagramNode.NodeId;
        }

        foreach ((string graphNodeId, string diagramNodeId) in graphToDiagramNodeId)
        {
            if (!graphNodesById.TryGetValue(graphNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string armId = DiagramAstGraphNodeClassifier.ReadArmId(graphNode);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                armIdToDiagramNodeId[ArmResourceIdNormalizer.Normalize(armId)] = diagramNodeId;
            }
        }

        return armIdToDiagramNodeId;
    }

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(GraphSnapshot graph)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVmNic, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                nicOwnerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return nicOwnerArmIdByNicArmId;
    }

    private static string ReadResourceName(string armId, string fallbackLabel)
    {
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armId.Length - 1)
        {
            return fallbackLabel;
        }

        return armId[(lastSlash + 1)..];
    }
}
