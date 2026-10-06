using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Projects stored relationship targets absent from the snapshot onto shared external cards (NR-27).</summary>
internal static class InventoryDiagramExternalTargetApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode)
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
        Dictionary<string, string> diagramNodeIdByArmId = BuildDiagramNodeIdByArmId(
            ast,
            graphToDiagramNodeId,
            graphNodesById);
        Dictionary<string, string> externalDiagramNodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        int nextOrderKey = ast.Nodes.Count == 0 ? 0 : ast.Nodes.Max(node => node.OrderKey) + 1;

        if (mode != DiagramMode.Executive)
        {
            ApplyConnectedPeerings(
                ast,
                graph,
                graphToDiagramNodeId,
                diagramNodeIdByArmId,
                externalDiagramNodeIdByArmId,
                ref nextOrderKey);
        }
        ApplyLoadBalancerBackends(
            ast,
            graph,
            graphToDiagramNodeId,
            diagramNodeIdByArmId,
            externalDiagramNodeIdByArmId,
            ref nextOrderKey);
        ApplyPrivateEndpointTargets(
            ast,
            graph,
            graphToDiagramNodeId,
            graphNodesById,
            diagramNodeIdByArmId,
            externalDiagramNodeIdByArmId,
            ref nextOrderKey);
    }

    private static void ApplyConnectedPeerings(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, string> diagramNodeIdByArmId,
        Dictionary<string, string> externalDiagramNodeIdByArmId,
        ref int nextOrderKey)
    {
        foreach (GraphNode vnetNode in graph.Nodes)
        {
            if (!graphToDiagramNodeId.TryGetValue(vnetNode.NodeId, out string? localDiagramNodeId)
                || !AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(
                    DiagramAstGraphNodeClassifier.ReadArmType(vnetNode))
                || !AzureInventoryVnetPeeringParser.TryGetPeeringsJson(vnetNode.Properties, out string? peeringsJson))
            {
                continue;
            }

            foreach (AzureInventoryVnetPeeringRecord peering in AzureInventoryVnetPeeringParser.ParsePeerings(peeringsJson))
            {
                if (!AzureInventoryVnetPeeringParser.IsConnectedPeeringState(peering.PeeringState)
                    || string.IsNullOrWhiteSpace(peering.RemoteVirtualNetworkArmId))
                {
                    continue;
                }

                string targetArmId = ArmResourceIdNormalizer.Normalize(peering.RemoteVirtualNetworkArmId);

                if (diagramNodeIdByArmId.TryGetValue(targetArmId, out string? existingDiagramNodeId))
                {
                    bool hasCapturedTarget = graph.Nodes.Any(node =>
                        string.Equals(
                            ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node)),
                            targetArmId,
                            StringComparison.OrdinalIgnoreCase)
                        && !(node.Properties.TryGetValue(ExecutiveVnetPeeringStubNodeFactory.StubPropertyKey, out string? stubKind)
                            && string.Equals(stubKind, ExecutiveVnetPeeringStubNodeFactory.RemoteVnetStubValue, StringComparison.OrdinalIgnoreCase)));
                    DiagramNode? existingDiagramNode = ast.Nodes.FirstOrDefault(node =>
                        string.Equals(node.NodeId, existingDiagramNodeId, StringComparison.Ordinal));

                    if (!hasCapturedTarget && existingDiagramNode is not null)
                    {
                        existingDiagramNode.Label = "Outside this subscription: " + ReadResourceName(targetArmId);
                        externalDiagramNodeIdByArmId[targetArmId] = existingDiagramNodeId;
                    }

                    continue;
                }

                string externalNodeId = GetOrCreateExternalNode(
                    ast,
                    targetArmId,
                    externalDiagramNodeIdByArmId,
                    ref nextOrderKey);
                InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                    ast,
                    localDiagramNodeId,
                    externalNodeId,
                    InventoryDiagramRelationshipLabelTexts.Peered,
                    GraphEdgeInferenceSources.InventoryVnetPeering,
                    ProvenanceKind.ObservedFact.ToString());
            }
        }
    }

    private static void ApplyLoadBalancerBackends(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, string> diagramNodeIdByArmId,
        Dictionary<string, string> externalDiagramNodeIdByArmId,
        ref int nextOrderKey)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = BuildNicOwnerArmIdMap(graph);

        foreach (GraphNode graphNode in graph.Nodes)
        {
            if (!graphToDiagramNodeId.TryGetValue(graphNode.NodeId, out string? sourceDiagramNodeId))
            {
                continue;
            }

            string armType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);
            IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> backendTargets =
                armType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase)
                    ? AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(graphNode)
                    : armType.Contains("applicationGateways", StringComparison.OrdinalIgnoreCase)
                        ? AzureInventoryLoadBalancerBackendTrafficResolver.ResolveApplicationGatewayBackends(graphNode)
                        : [];

            foreach (AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget backendTarget in backendTargets)
            {
                string targetArmId = ArmResourceIdNormalizer.Normalize(backendTarget.TargetArmId);

                if (nicOwnerArmIdByNicArmId.TryGetValue(targetArmId, out string? ownerArmId))
                {
                    targetArmId = ownerArmId;
                }

                if (diagramNodeIdByArmId.ContainsKey(targetArmId))
                {
                    continue;
                }

                string externalNodeId = GetOrCreateExternalNode(
                    ast,
                    targetArmId,
                    externalDiagramNodeIdByArmId,
                    ref nextOrderKey);
                InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                    ast,
                    sourceDiagramNodeId,
                    externalNodeId,
                    InventoryDiagramRelationshipLabelTexts.FormatSendsTrafficTo(backendTarget.RulePort),
                    GraphEdgeInferenceSources.InventoryLbBackend,
                    ProvenanceKind.ObservedFact.ToString());
            }
        }
    }

    private static void ApplyPrivateEndpointTargets(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> diagramNodeIdByArmId,
        Dictionary<string, string> externalDiagramNodeIdByArmId,
        ref int nextOrderKey)
    {
        Dictionary<string, List<string>> adjacency = BuildStoredAdjacency(graph);
        Dictionary<string, string> visibleVnetDiagramNodeIdByGraphNodeId = graph.Nodes
            .Where(node => graphToDiagramNodeId.ContainsKey(node.NodeId)
                && AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(
                    DiagramAstGraphNodeClassifier.ReadArmType(node)))
            .ToDictionary(
                node => node.NodeId,
                node => graphToDiagramNodeId[node.NodeId],
                StringComparer.Ordinal);

        foreach (GraphNode privateEndpointNode in graph.Nodes.Where(IsPrivateEndpointNode))
        {
            foreach (string targetArmId in EnumeratePrivateEndpointTargets(privateEndpointNode.Properties))
            {
                if (diagramNodeIdByArmId.ContainsKey(targetArmId))
                {
                    continue;
                }

                string? sourceDiagramNodeId = ResolveVisibleVnet(
                    privateEndpointNode.NodeId,
                    graphNodesById,
                    adjacency,
                    visibleVnetDiagramNodeIdByGraphNodeId);

                if (string.IsNullOrWhiteSpace(sourceDiagramNodeId))
                {
                    continue;
                }

                string externalNodeId = GetOrCreateExternalNode(
                    ast,
                    targetArmId,
                    externalDiagramNodeIdByArmId,
                    ref nextOrderKey);
                InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                    ast,
                    sourceDiagramNodeId,
                    externalNodeId,
                    InventoryDiagramRelationshipLabelTexts.PrivateAccess,
                    GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    ProvenanceKind.DerivedFact.ToString());
            }
        }
    }

    private static string GetOrCreateExternalNode(
        DiagramAst ast,
        string targetArmId,
        Dictionary<string, string> externalDiagramNodeIdByArmId,
        ref int nextOrderKey)
    {
        if (externalDiagramNodeIdByArmId.TryGetValue(targetArmId, out string? existingNodeId))
        {
            return existingNodeId;
        }

        string nodeId = MermaidIdSanitizer.Sanitize("outside-subscription-" + targetArmId);
        ast.Nodes.Add(new DiagramNode
        {
            NodeId = nodeId,
            Label = "Outside this subscription: " + ReadResourceName(targetArmId),
            NodeType = GraphNodeTypes.TopologyResource,
            OrderKey = nextOrderKey++,
            ArmResourceId = targetArmId,
        });
        externalDiagramNodeIdByArmId[targetArmId] = nodeId;

        return nodeId;
    }

    private static Dictionary<string, string> BuildDiagramNodeIdByArmId(
        DiagramAst ast,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> diagramNodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (!string.IsNullOrWhiteSpace(diagramNode.ArmResourceId))
            {
                diagramNodeIdByArmId[ArmResourceIdNormalizer.Normalize(diagramNode.ArmResourceId)] = diagramNode.NodeId;
            }
        }

        foreach ((string graphNodeId, string diagramNodeId) in graphToDiagramNodeId)
        {
            if (!graphNodesById.TryGetValue(graphNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string armId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(graphNode));

            if (!string.IsNullOrWhiteSpace(armId))
            {
                diagramNodeIdByArmId[armId] = diagramNodeId;
            }
        }

        return diagramNodeIdByArmId;
    }

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(GraphSnapshot graph)
    {
        Dictionary<string, string> ownerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVmNic, StringComparison.OrdinalIgnoreCase)
                || !graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                ownerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return ownerArmIdByNicArmId;
    }

    private static Dictionary<string, List<string>> BuildStoredAdjacency(GraphSnapshot graph)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges.Where(IsStoredEdge))
        {
            AddNeighbor(adjacency, edge.FromNodeId, edge.ToNodeId);
            AddNeighbor(adjacency, edge.ToNodeId, edge.FromNodeId);
        }

        return adjacency;
    }

    private static string? ResolveVisibleVnet(
        string privateEndpointNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, List<string>> adjacency,
        IReadOnlyDictionary<string, string> visibleVnetDiagramNodeIdByGraphNodeId)
    {
        Queue<string> pending = new();
        HashSet<string> visited = new(StringComparer.Ordinal) { privateEndpointNodeId };
        pending.Enqueue(privateEndpointNodeId);

        while (pending.Count > 0)
        {
            string currentNodeId = pending.Dequeue();

            if (graphNodesById.TryGetValue(currentNodeId, out GraphNode? currentNode)
                && DiagramAstVnetTopologyResolver.IsSubnetNode(currentNode))
            {
                string? parentArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(
                    DiagramAstGraphNodeClassifier.ReadArmId(currentNode));

                foreach ((string vnetGraphNodeId, string vnetDiagramNodeId) in visibleVnetDiagramNodeIdByGraphNodeId)
                {
                    if (parentArmId is not null
                        && graphNodesById.TryGetValue(vnetGraphNodeId, out GraphNode? vnetNode)
                        && string.Equals(
                            ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(vnetNode)),
                            ArmResourceIdNormalizer.Normalize(parentArmId),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return vnetDiagramNodeId;
                    }
                }
            }

            if (!string.Equals(currentNodeId, privateEndpointNodeId, StringComparison.Ordinal)
                && visibleVnetDiagramNodeIdByGraphNodeId.TryGetValue(currentNodeId, out string? diagramNodeId))
            {
                return diagramNodeId;
            }

            if (!adjacency.TryGetValue(currentNodeId, out List<string>? neighbors))
            {
                continue;
            }

            foreach (string neighborNodeId in neighbors)
            {
                if (!visited.Add(neighborNodeId))
                {
                    continue;
                }

                if (visibleVnetDiagramNodeIdByGraphNodeId.ContainsKey(neighborNodeId))
                {
                    pending.Enqueue(neighborNodeId);
                    continue;
                }

                if (!graphNodesById.TryGetValue(neighborNodeId, out GraphNode? neighbor)
                    || !IsNetworkAttachmentNode(neighbor))
                {
                    continue;
                }

                pending.Enqueue(neighborNodeId);
            }
        }

        return null;
    }

    private static IEnumerable<string> EnumeratePrivateEndpointTargets(IReadOnlyDictionary<string, string> properties)
    {
        HashSet<string> targetArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> property in properties)
        {
            if (property.Key.StartsWith("privateLinkServiceId", StringComparison.OrdinalIgnoreCase))
            {
                AddTarget(targetArmIds, property.Value);
            }
        }

        foreach (string propertyName in new[] { "privateLinkServiceConnections", "manualPrivateLinkServiceConnections" })
        {
            if (!properties.TryGetValue(propertyName, out string? json) || string.IsNullOrWhiteSpace(json))
            {
                continue;
            }

            TryReadPrivateLinkServiceIds(json, targetArmIds);
        }

        return targetArmIds;
    }

    private static void TryReadPrivateLinkServiceIds(string json, HashSet<string> targetArmIds)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement item in document.RootElement.EnumerateArray())
            {
                if (!item.TryGetProperty("properties", out JsonElement properties)
                    || !properties.TryGetProperty("privateLinkServiceId", out JsonElement target)
                    || target.ValueKind is not JsonValueKind.String)
                {
                    continue;
                }

                AddTarget(targetArmIds, target.GetString());
            }
        }
        catch (JsonException)
        {
        }
    }

    private static void AddTarget(HashSet<string> targetArmIds, string? targetArmId)
    {
        string normalized = ArmResourceIdNormalizer.Normalize(targetArmId ?? string.Empty);

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            targetArmIds.Add(normalized);
        }
    }

    private static bool IsPrivateEndpointNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        return armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNetworkAttachmentNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        return IsPrivateEndpointNode(node)
            || armType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("/subnets", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("routeTables", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsStoredEdge(GraphEdge edge)
    {
        return edge.Weight >= DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight
            && !string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                StringComparison.OrdinalIgnoreCase);
    }

    private static void AddNeighbor(Dictionary<string, List<string>> adjacency, string sourceNodeId, string targetNodeId)
    {
        if (!adjacency.TryGetValue(sourceNodeId, out List<string>? neighbors))
        {
            neighbors = [];
            adjacency[sourceNodeId] = neighbors;
        }

        neighbors.Add(targetNodeId);
    }

    private static string ReadResourceName(string armId)
    {
        int lastSlash = armId.LastIndexOf('/');

        return lastSlash >= 0 && lastSlash < armId.Length - 1
            ? armId[(lastSlash + 1)..]
            : armId;
    }
}
