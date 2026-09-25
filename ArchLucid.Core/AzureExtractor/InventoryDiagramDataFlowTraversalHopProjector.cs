using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Projects cited traversal relationships into ordered data-flow hop paths (NR-07).
/// </summary>
public static class InventoryDiagramDataFlowTraversalHopProjector
{
    public static IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> CollectTraversalLinks(GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        List<InventoryDiagramDataFlowTraversalHopLink> links = [];
        HashSet<string> linkKeys = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsTraversalGraphEdge(edge))
            {
                continue;
            }

            if (!graphNodesById.ContainsKey(edge.FromNodeId) || !graphNodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            InventoryDiagramDataFlowTraversalHopEvidence? evidence = ResolveEvidence(edge);

            if (evidence is null)
            {
                continue;
            }

            AddLink(links, linkKeys, edge.FromNodeId, edge.ToNodeId, evidence);
        }

        AddRouteTableTraversalLinks(graph, graphNodesById, links, linkKeys);
        AddPrivateEndpointTraversalLinks(graph, graphNodesById, links, linkKeys);

        return links;
    }

    public static InventoryDiagramDataFlowTraversalHopPath ProjectPath(
        string sourceNodeId,
        string targetNodeId,
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> traversalLinks,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceNodeId);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetNodeId);
        ArgumentNullException.ThrowIfNull(traversalLinks);
        ArgumentNullException.ThrowIfNull(graphNodesById);

        if (string.Equals(sourceNodeId, targetNodeId, StringComparison.Ordinal))
        {
            return new InventoryDiagramDataFlowTraversalHopPath
            {
                SourceNodeId = sourceNodeId,
                TargetNodeId = targetNodeId,
            };
        }

        Dictionary<string, List<InventoryDiagramDataFlowTraversalHopLink>> adjacency =
            BuildAdjacency(traversalLinks);

        List<string> bestHopNodeIds = [];
        List<InventoryDiagramDataFlowTraversalHopLink> bestLinks = [];
        string? missingHopDescription = null;

        void TryPath(IReadOnlyList<string> hopNodeIds, IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> pathLinks)
        {
            if (hopNodeIds.Count <= bestHopNodeIds.Count)
            {
                return;
            }

            bestHopNodeIds = hopNodeIds.ToList();
            bestLinks = pathLinks.ToList();
            missingHopDescription = null;
        }

        void TryPartialPath(
            IReadOnlyList<string> hopNodeIds,
            IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> pathLinks,
            string gapDescription)
        {
            if (hopNodeIds.Count == 0)
            {
                return;
            }

            if (bestHopNodeIds.Count > hopNodeIds.Count && !string.IsNullOrWhiteSpace(missingHopDescription))
            {
                return;
            }

            if (bestHopNodeIds.Count == hopNodeIds.Count
                && bestLinks.Count >= pathLinks.Count
                && !string.IsNullOrWhiteSpace(missingHopDescription))
            {
                return;
            }

            bestHopNodeIds = hopNodeIds.ToList();
            bestLinks = pathLinks.ToList();
            missingHopDescription = gapDescription;
        }

        bool foundCompletePath = TryFindPath(
            sourceNodeId,
            targetNodeId,
            adjacency,
            graphNodesById,
            out List<string> fullPathNodeIds,
            out List<InventoryDiagramDataFlowTraversalHopLink> fullPathLinks);

        bool foundPartialPath = TryFindPartialPath(
            sourceNodeId,
            targetNodeId,
            adjacency,
            graphNodesById,
            out List<string> partialPathNodeIds,
            out List<InventoryDiagramDataFlowTraversalHopLink> partialPathLinks,
            out string gapDescription);

        if (foundCompletePath && fullPathNodeIds.Count > 0)
        {
            TryPath(fullPathNodeIds, fullPathLinks);
        }
        else if (foundPartialPath && partialPathNodeIds.Count > 0)
        {
            TryPartialPath(partialPathNodeIds, partialPathLinks, gapDescription);
        }
        else if (foundCompletePath && fullPathLinks.Count > 0)
        {
            TryPath(fullPathNodeIds, fullPathLinks);
        }

        return new InventoryDiagramDataFlowTraversalHopPath
        {
            SourceNodeId = sourceNodeId,
            TargetNodeId = targetNodeId,
            OrderedHopNodeIds = bestHopNodeIds,
            OrderedLinks = bestLinks,
            MissingHopDescription = missingHopDescription,
        };
    }

    public static IReadOnlyList<InventoryDiagramDataFlowTraversalHopPath> ProjectDataFlowEdgePaths(
        GraphSnapshot graph,
        IReadOnlyList<GraphEdge> dataFlowEdges)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(dataFlowEdges);

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> traversalLinks = CollectTraversalLinks(graph);
        List<InventoryDiagramDataFlowTraversalHopPath> paths = [];
        HashSet<string> pathKeys = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in dataFlowEdges)
        {
            string pathKey = $"{edge.FromNodeId}|{edge.ToNodeId}";

            if (!pathKeys.Add(pathKey))
            {
                continue;
            }

            paths.Add(ProjectPath(edge.FromNodeId, edge.ToNodeId, traversalLinks, graphNodesById));
        }

        return paths;
    }

    private static bool IsTraversalGraphEdge(GraphEdge edge)
    {
        return InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(
            edge.EdgeType,
            edge.InferenceSource);
    }

    private static InventoryDiagramDataFlowTraversalHopEvidence? ResolveEvidence(GraphEdge edge)
    {
        if (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
            && fromType is not null
            && fromType.IncludeOnDataFlow)
        {
            return new InventoryDiagramDataFlowTraversalHopEvidence
            {
                AssociationType = fromType.AssociationType,
                InferenceSource = edge.InferenceSource,
                DiagramLabel = fromType.DiagramLabel,
            };
        }

        if (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.InferenceSource, out AzureInventoryDataFlowEvidenceAssociation? fromInference)
            && fromInference is not null
            && fromInference.IncludeOnDataFlow)
        {
            return new InventoryDiagramDataFlowTraversalHopEvidence
            {
                AssociationType = fromInference.AssociationType,
                InferenceSource = edge.InferenceSource,
                DiagramLabel = fromInference.DiagramLabel,
            };
        }

        if (!InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(edge.EdgeType, edge.InferenceSource))
        {
            return null;
        }

        string associationType = edge.EdgeType ?? edge.InferenceSource ?? "traversal-hop";

        return new InventoryDiagramDataFlowTraversalHopEvidence
        {
            AssociationType = associationType,
            InferenceSource = edge.InferenceSource,
            DiagramLabel = ResolveTraversalDiagramLabel(associationType),
        };
    }

    private static string ResolveTraversalDiagramLabel(string associationType)
    {
        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.FirewallToSubnet, StringComparison.OrdinalIgnoreCase)
            || associationType.Equals(AzureInventoryRelationshipAssociationTypes.NatGatewayToSubnet, StringComparison.OrdinalIgnoreCase)
            || associationType.Equals("inventory-route-table-route", StringComparison.OrdinalIgnoreCase))
        {
            return "Routes through";
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || associationType.Equals(AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase))
        {
            return "Private network path";
        }

        if (associationType.Equals(AzureInventoryRelationshipAssociationTypes.NetworkConnection, StringComparison.OrdinalIgnoreCase))
        {
            return "Connects through";
        }

        return "Routes to";
    }

    private static void AddRouteTableTraversalLinks(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<InventoryDiagramDataFlowTraversalHopLink> links,
        HashSet<string> linkKeys)
    {
        Dictionary<string, HashSet<string>> subnetNodeIdsBySubnetArmId = BuildSubnetNodeIdsBySubnetArmId(graph);
        Dictionary<string, string> subnetArmIdByNodeId = BuildSubnetArmIdByNodeId(graph);
        Dictionary<string, HashSet<string>> subnetAttachedConsumerNodeIdsBySubnetArmId =
            BuildSubnetAttachedConsumerNodeIdsBySubnetArmId(graph, subnetArmIdByNodeId);
        Dictionary<string, GraphNode> traversalHopNodesByArmId = graphNodesById.Values
            .Where(InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopNode)
            .Select(node => (ArmId: ArmResourceIdNormalizer.Normalize(ReadArmId(node)), Node: node))
            .Where(pair => !string.IsNullOrWhiteSpace(pair.ArmId))
            .GroupBy(pair => pair.ArmId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Node, StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode graphNode in graph.Nodes)
        {
            string armType = ReadArmType(graphNode);

            if (!armType.Equals("Microsoft.Network/routeTables", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            IReadOnlyList<string> subnetArmIds = AzureInventoryRouteTableSubnetAssociationParser.Parse(graphNode.Properties);
            IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(graphNode.Properties);

            foreach (string subnetArmId in subnetArmIds)
            {
                if (!subnetNodeIdsBySubnetArmId.TryGetValue(
                        ArmResourceIdNormalizer.Normalize(subnetArmId),
                        out HashSet<string>? subnetNodeIds))
                {
                    continue;
                }

                foreach (AzureInventoryRouteTableRoute route in routes)
                {
                    string? nextHopArmId = AzureInventoryRouteTableNextHopResolver.Resolve(route, graph.Nodes);

                    if (string.IsNullOrWhiteSpace(nextHopArmId)
                        || !traversalHopNodesByArmId.TryGetValue(nextHopArmId, out GraphNode? nextHopNode))
                    {
                        continue;
                    }

                    InventoryDiagramDataFlowTraversalHopEvidence evidence = new()
                    {
                        AssociationType = "inventory-route-table-route",
                        InferenceSource = "inventory-route-table-route",
                        DiagramLabel = "Routes through",
                    };

                    foreach (string subnetNodeId in subnetNodeIds)
                    {
                        AddLink(links, linkKeys, subnetNodeId, nextHopNode.NodeId, evidence);

                        if (!subnetAttachedConsumerNodeIdsBySubnetArmId.TryGetValue(
                                ArmResourceIdNormalizer.Normalize(subnetArmId),
                                out HashSet<string>? originNodeIds))
                        {
                            continue;
                        }

                        foreach (string originNodeId in originNodeIds)
                        {
                            AddLink(links, linkKeys, originNodeId, nextHopNode.NodeId, evidence);
                        }
                    }
                }
            }
        }
    }

    private static void AddPrivateEndpointTraversalLinks(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<InventoryDiagramDataFlowTraversalHopLink> links,
        HashSet<string> linkKeys)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = BuildNicOwnerArmIdMap(graph, graphNodesById);
        Dictionary<string, string> graphNodeIdByArmId = graphNodesById.Values
            .Select(node => (ArmId: ArmResourceIdNormalizer.Normalize(ReadArmId(node)), NodeId: node.NodeId))
            .Where(pair => !string.IsNullOrWhiteSpace(pair.ArmId))
            .GroupBy(pair => pair.ArmId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().NodeId, StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(
                    edge.EdgeType,
                    AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? privateEndpointNodeId = FindPrivateEndpointBetween(
                graph,
                edge.FromNodeId,
                edge.ToNodeId,
                graphNodesById,
                nicOwnerArmIdByNicArmId,
                graphNodeIdByArmId);

            if (string.IsNullOrWhiteSpace(privateEndpointNodeId))
            {
                continue;
            }

            InventoryDiagramDataFlowTraversalHopEvidence evidence = new()
            {
                AssociationType = AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
                InferenceSource = "inventory-pe-reachable-target",
                DiagramLabel = "Private network path",
            };

            AddLink(links, linkKeys, edge.FromNodeId, privateEndpointNodeId, evidence);
            AddLink(links, linkKeys, privateEndpointNodeId, edge.ToNodeId, evidence);
        }
    }

    private static string? FindPrivateEndpointBetween(
        GraphSnapshot graph,
        string consumerNodeId,
        string targetNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicOwnerArmIdByNicArmId,
        IReadOnlyDictionary<string, string> graphNodeIdByArmId)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(
                    edge.EdgeType,
                    AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    StringComparison.OrdinalIgnoreCase)
                || !string.Equals(edge.ToNodeId, targetNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            string privateEndpointNodeId = edge.FromNodeId;

            if (HasPrivateEndpointPlacementToConsumer(
                    graph,
                    privateEndpointNodeId,
                    consumerNodeId,
                    graphNodesById,
                    nicOwnerArmIdByNicArmId,
                    graphNodeIdByArmId))
            {
                return privateEndpointNodeId;
            }
        }

        return null;
    }

    private static bool HasPrivateEndpointPlacementToConsumer(
        GraphSnapshot graph,
        string privateEndpointNodeId,
        string consumerNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicOwnerArmIdByNicArmId,
        IReadOnlyDictionary<string, string> graphNodeIdByArmId)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.FromNodeId, privateEndpointNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (string.Equals(edge.ToNodeId, consumerNodeId, StringComparison.Ordinal))
            {
                return true;
            }

            if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase)
                && nicOwnerArmIdByNicArmId.TryGetValue(
                    ReadArmIdFromNodeId(graphNodesById, edge.ToNodeId),
                    out string? ownerArmId)
                && graphNodeIdByArmId.TryGetValue(
                    ownerArmId,
                    out string? ownerNodeId)
                && string.Equals(ownerNodeId, consumerNodeId, StringComparison.Ordinal))
            {
                return true;
            }

            if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
                && ConsumerUsesSubnet(
                    graph,
                    consumerNodeId,
                    edge.ToNodeId,
                    graphNodesById,
                    nicOwnerArmIdByNicArmId,
                    graphNodeIdByArmId))
            {
                return true;
            }
        }

        return false;
    }

    private static bool ConsumerUsesSubnet(
        GraphSnapshot graph,
        string consumerNodeId,
        string subnetNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicOwnerArmIdByNicArmId,
        IReadOnlyDictionary<string, string> graphNodeIdByArmId)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.FromNodeId, consumerNodeId, StringComparison.Ordinal)
                && !string.Equals(edge.ToNodeId, consumerNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.ToNodeId, subnetNodeId, StringComparison.Ordinal))
            {
                return true;
            }

            if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.FromNodeId, consumerNodeId, StringComparison.Ordinal)
                && string.Equals(edge.ToNodeId, subnetNodeId, StringComparison.Ordinal))
            {
                return true;
            }
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(edge.ToNodeId, subnetNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            string nicArmId = ReadArmIdFromNodeId(graphNodesById, edge.FromNodeId);

            if (string.IsNullOrWhiteSpace(nicArmId)
                || !nicOwnerArmIdByNicArmId.TryGetValue(nicArmId, out string? ownerArmId)
                || !graphNodeIdByArmId.TryGetValue(ownerArmId, out string? ownerNodeId))
            {
                continue;
            }

            if (string.Equals(ownerNodeId, consumerNodeId, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static string ReadArmIdFromNodeId(
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        string nodeId)
    {
        return graphNodesById.TryGetValue(nodeId, out GraphNode? node)
            ? ArmResourceIdNormalizer.Normalize(ReadArmId(node))
            : string.Empty;
    }

    private static Dictionary<string, HashSet<string>> BuildSubnetAttachedConsumerNodeIdsBySubnetArmId(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> subnetArmIdByNodeId)
    {
        Dictionary<string, HashSet<string>> subnetAttachedConsumerNodeIdsBySubnetArmId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach ((string nodeId, string subnetArmId) in subnetArmIdByNodeId)
        {
            string normalizedSubnetArmId = ArmResourceIdNormalizer.Normalize(subnetArmId);

            if (!subnetAttachedConsumerNodeIdsBySubnetArmId.TryGetValue(
                    normalizedSubnetArmId,
                    out HashSet<string>? consumerNodeIds))
            {
                consumerNodeIds = new HashSet<string>(StringComparer.Ordinal);
                subnetAttachedConsumerNodeIdsBySubnetArmId[normalizedSubnetArmId] = consumerNodeIds;
            }

            consumerNodeIds.Add(nodeId);
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
                || !subnetArmIdByNodeId.TryGetValue(edge.ToNodeId, out string? appSubnetArmId))
            {
                continue;
            }

            string normalizedSubnetArmId = ArmResourceIdNormalizer.Normalize(appSubnetArmId);

            if (!subnetAttachedConsumerNodeIdsBySubnetArmId.TryGetValue(
                    normalizedSubnetArmId,
                    out HashSet<string>? consumerNodeIds))
            {
                consumerNodeIds = new HashSet<string>(StringComparer.Ordinal);
                subnetAttachedConsumerNodeIdsBySubnetArmId[normalizedSubnetArmId] = consumerNodeIds;
            }

            consumerNodeIds.Add(edge.FromNodeId);
        }

        return subnetAttachedConsumerNodeIdsBySubnetArmId;
    }

    private static Dictionary<string, HashSet<string>> BuildSubnetNodeIdsBySubnetArmId(GraphSnapshot graph)
    {
        Dictionary<string, HashSet<string>> subnetNodeIdsBySubnetArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = ReadArmType(node);

            if (!armType.Contains("/subnets", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string armId = ArmResourceIdNormalizer.Normalize(ReadArmId(node));

            if (string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            if (!subnetNodeIdsBySubnetArmId.TryGetValue(armId, out HashSet<string>? subnetNodeIds))
            {
                subnetNodeIds = new HashSet<string>(StringComparer.Ordinal);
                subnetNodeIdsBySubnetArmId[armId] = subnetNodeIds;
            }

            subnetNodeIds.Add(node.NodeId);
        }

        return subnetNodeIdsBySubnetArmId;
    }

    private static Dictionary<string, string> BuildSubnetArmIdByNodeId(GraphSnapshot graph)
    {
        Dictionary<string, string> subnetArmIdByNodeId = new(StringComparer.Ordinal);

        foreach (GraphNode node in graph.Nodes)
        {
            string armId = ArmResourceIdNormalizer.Normalize(ReadArmId(node));

            if (string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            if (ReadArmType(node).Contains("/subnets", StringComparison.OrdinalIgnoreCase))
            {
                subnetArmIdByNodeId[node.NodeId] = armId;
            }
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!subnetArmIdByNodeId.TryGetValue(edge.ToNodeId, out string? subnetArmId))
            {
                continue;
            }

            subnetArmIdByNodeId[edge.FromNodeId] = subnetArmId;
        }

        return subnetArmIdByNodeId;
    }

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsVmToNicEdge(edge))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                nicOwnerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return nicOwnerArmIdByNicArmId;
    }

    private static bool IsVmToNicEdge(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.InferenceSource, InventoryDiagramIndirectRelationshipEdgeSources.VmNic, StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, List<InventoryDiagramDataFlowTraversalHopLink>> BuildAdjacency(
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> traversalLinks)
    {
        Dictionary<string, List<InventoryDiagramDataFlowTraversalHopLink>> adjacency = new(StringComparer.Ordinal);

        foreach (InventoryDiagramDataFlowTraversalHopLink link in traversalLinks)
        {
            if (!adjacency.TryGetValue(link.FromNodeId, out List<InventoryDiagramDataFlowTraversalHopLink>? outgoing))
            {
                outgoing = [];
                adjacency[link.FromNodeId] = outgoing;
            }

            outgoing.Add(link);
        }

        foreach ((string _, List<InventoryDiagramDataFlowTraversalHopLink> outgoing) in adjacency)
        {
            outgoing.Sort((left, right) => string.Compare(left.ToNodeId, right.ToNodeId, StringComparison.Ordinal));
        }

        return adjacency;
    }

    private static bool TryFindPath(
        string sourceNodeId,
        string targetNodeId,
        IReadOnlyDictionary<string, List<InventoryDiagramDataFlowTraversalHopLink>> adjacency,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        out List<string> hopNodeIds,
        out List<InventoryDiagramDataFlowTraversalHopLink> pathLinks)
    {
        List<string> bestHopNodeIds = [];
        List<InventoryDiagramDataFlowTraversalHopLink> bestPathLinks = [];

        void ConsiderCandidate(IReadOnlyList<string> candidateHopNodeIds, IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> candidateLinks)
        {
            if (candidateHopNodeIds.Count < bestHopNodeIds.Count
                || (candidateHopNodeIds.Count == bestHopNodeIds.Count && candidateLinks.Count <= bestPathLinks.Count))
            {
                return;
            }

            bestHopNodeIds = candidateHopNodeIds.ToList();
            bestPathLinks = candidateLinks.ToList();
        }

        void Walk(
            string currentNodeId,
            HashSet<string> visited,
            List<string> currentHopNodeIds,
            List<InventoryDiagramDataFlowTraversalHopLink> currentLinks)
        {
            if (string.Equals(currentNodeId, targetNodeId, StringComparison.Ordinal))
            {
                ConsiderCandidate(currentHopNodeIds, currentLinks);
                return;
            }

            if (!adjacency.TryGetValue(currentNodeId, out List<InventoryDiagramDataFlowTraversalHopLink>? outgoing))
            {
                return;
            }

            foreach (InventoryDiagramDataFlowTraversalHopLink link in outgoing)
            {
                if (!visited.Add(link.ToNodeId))
                {
                    continue;
                }

                List<string> nextHopNodeIds = currentHopNodeIds.ToList();

                if (graphNodesById.TryGetValue(link.ToNodeId, out GraphNode? hopNode)
                    && InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopNode(hopNode))
                {
                    nextHopNodeIds.Add(link.ToNodeId);
                }

                List<InventoryDiagramDataFlowTraversalHopLink> nextLinks = currentLinks.ToList();
                nextLinks.Add(link);
                Walk(link.ToNodeId, visited, nextHopNodeIds, nextLinks);
                visited.Remove(link.ToNodeId);
            }
        }

        Walk(sourceNodeId, new HashSet<string>(StringComparer.Ordinal) { sourceNodeId }, [], []);

        hopNodeIds = bestHopNodeIds;
        pathLinks = bestPathLinks;

        return hopNodeIds.Count > 0 || pathLinks.Count > 0;
    }

    private static bool TryFindPartialPath(
        string sourceNodeId,
        string targetNodeId,
        IReadOnlyDictionary<string, List<InventoryDiagramDataFlowTraversalHopLink>> adjacency,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        out List<string> hopNodeIds,
        out List<InventoryDiagramDataFlowTraversalHopLink> pathLinks,
        out string gapDescription)
    {
        hopNodeIds = [];
        pathLinks = [];
        gapDescription = string.Empty;

        if (!adjacency.ContainsKey(sourceNodeId))
        {
            return false;
        }

        Queue<(string NodeId, List<string> Nodes, List<InventoryDiagramDataFlowTraversalHopLink> Links)> queue = new();
        HashSet<string> visited = new(StringComparer.Ordinal) { sourceNodeId };
        queue.Enqueue((sourceNodeId, [], []));

        List<string> bestHopNodeIds = [];
        List<InventoryDiagramDataFlowTraversalHopLink> bestPathLinks = [];

        while (queue.Count > 0)
        {
            (string currentNodeId, List<string> currentNodes, List<InventoryDiagramDataFlowTraversalHopLink> currentLinks) = queue.Dequeue();

            if (currentNodes.Count > bestHopNodeIds.Count)
            {
                bestHopNodeIds = currentNodes;
                bestPathLinks = currentLinks;
            }

            if (!adjacency.TryGetValue(currentNodeId, out List<InventoryDiagramDataFlowTraversalHopLink>? outgoing))
            {
                continue;
            }

            foreach (InventoryDiagramDataFlowTraversalHopLink link in outgoing)
            {
                if (!visited.Add(link.ToNodeId))
                {
                    continue;
                }

                List<string> nextNodes = currentNodes.ToList();

                if (graphNodesById.TryGetValue(link.ToNodeId, out GraphNode? hopNode)
                    && InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopNode(hopNode))
                {
                    nextNodes.Add(link.ToNodeId);
                }

                List<InventoryDiagramDataFlowTraversalHopLink> nextLinks = currentLinks.ToList();
                nextLinks.Add(link);
                queue.Enqueue((link.ToNodeId, nextNodes, nextLinks));
            }
        }

        if (bestHopNodeIds.Count == 0)
        {
            return false;
        }

        string lastHopLabel = graphNodesById.TryGetValue(bestHopNodeIds[^1], out GraphNode? lastHopNode)
            ? ReadResourceName(ReadArmId(lastHopNode))
            : bestHopNodeIds[^1];
        string targetLabel = graphNodesById.TryGetValue(targetNodeId, out GraphNode? targetNode)
            ? ReadResourceName(ReadArmId(targetNode))
            : targetNodeId;

        hopNodeIds = bestHopNodeIds;
        pathLinks = bestPathLinks;
        gapDescription = $"missing hop after {lastHopLabel} toward {targetLabel}";

        return true;
    }

    private static void AddLink(
        List<InventoryDiagramDataFlowTraversalHopLink> links,
        HashSet<string> linkKeys,
        string fromNodeId,
        string toNodeId,
        InventoryDiagramDataFlowTraversalHopEvidence evidence)
    {
        if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
        {
            return;
        }

        string linkKey = $"{fromNodeId}|{toNodeId}|{evidence.AssociationType}";

        if (!linkKeys.Add(linkKey))
        {
            return;
        }

        links.Add(new InventoryDiagramDataFlowTraversalHopLink
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Evidence = evidence,
        });
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.type", out string? armType) && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType;
    }

    private static string ReadArmId(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
        {
            return armId;
        }

        return node.SourceId ?? node.NodeId;
    }

    private static string ReadResourceName(string armId)
    {
        int lastSlash = armId.LastIndexOf('/');

        return lastSlash < 0 || lastSlash >= armId.Length - 1
            ? armId
            : armId[(lastSlash + 1)..];
    }
}
