using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Recategorizes connection, workflow, and policy nodes as labeled relationship edges (NR-01, NR-02).
/// </summary>
internal static class InventoryDiagramNodeRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode = DiagramMode.FullSubscription)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        bool emitPolicyEdges = mode != DiagramMode.DataFlow;

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(ast, graphToDiagramNodeId, graphNodesById);
        HashSet<string> removedDiagramNodeIds = new(StringComparer.Ordinal);

        foreach (DiagramNode diagramNode in ast.Nodes.ToList())
        {
            if (!InventoryDiagramNodeRelationshipClassifier.TryClassify(
                    diagramNode.ArmResourceType,
                    out InventoryDiagramNodeRelationshipCategory category))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            switch (category)
            {
                case InventoryDiagramNodeRelationshipCategory.Connection:
                    TryPromoteConnectionNode(
                        ast,
                        diagramNode,
                        graphNode,
                        armIdToDiagramNodeId,
                        removedDiagramNodeIds);
                    break;
                case InventoryDiagramNodeRelationshipCategory.Workflow:
                    PromoteWorkflowNode(ast, diagramNode, graphNode, armIdToDiagramNodeId);
                    break;
                case InventoryDiagramNodeRelationshipCategory.Policy:
                    TryPromotePolicyNode(
                        ast,
                        diagramNode,
                        graphNode,
                        graph,
                        armIdToDiagramNodeId,
                        removedDiagramNodeIds,
                        emitPolicyEdges);
                    break;
            }
        }

        if (removedDiagramNodeIds.Count == 0)
        {
            return;
        }

        ast.Nodes.RemoveAll(node => removedDiagramNodeIds.Contains(node.NodeId));
        ast.Edges.RemoveAll(edge =>
            removedDiagramNodeIds.Contains(edge.FromNodeId) || removedDiagramNodeIds.Contains(edge.ToNodeId));
    }

    private static bool TryPromoteConnectionNode(
        DiagramAst ast,
        DiagramNode connectionNode,
        GraphNode graphNode,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        ISet<string> removedDiagramNodeIds)
    {
        if (!graphNode.Properties.TryGetValue(
                InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId,
                out string? endpoint1ArmId)
            || !graphNode.Properties.TryGetValue(
                InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId,
                out string? endpoint2ArmId)
            || string.IsNullOrWhiteSpace(endpoint1ArmId)
            || string.IsNullOrWhiteSpace(endpoint2ArmId))
        {
            return false;
        }

        if (!armIdToDiagramNodeId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(endpoint1ArmId),
                out string? fromDiagramNodeId)
            || !armIdToDiagramNodeId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(endpoint2ArmId),
                out string? toDiagramNodeId))
        {
            return false;
        }

        string connectionType = graphNode.Properties.TryGetValue(
            InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType,
            out string? typeValue)
            ? typeValue
            : connectionNode.Label;

        string edgeLabel = BuildConnectionEdgeLabel(connectionType, endpoint1ArmId, endpoint2ArmId);
        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(graphNode);

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = fromDiagramNodeId,
            ToNodeId = toDiagramNodeId,
            Label = InventoryDiagramEvidenceCurrencyLabels.Format(evidenceCurrency, edgeLabel),
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
            InferenceSource = ResolveConnectionInferenceSource(DiagramAstGraphNodeClassifier.ReadArmType(graphNode)),
        });

        removedDiagramNodeIds.Add(connectionNode.NodeId);
        return true;
    }

    private static bool TryPromotePolicyNode(
        DiagramAst ast,
        DiagramNode policyNode,
        GraphNode graphNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        ISet<string> removedDiagramNodeIds,
        bool emitPolicyEdges)
    {
        string? armResourceType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);

        if (armResourceType?.Equals("Microsoft.Network/routeTables", StringComparison.OrdinalIgnoreCase) == true)
        {
            return TryPromoteRouteTableNode(
                ast,
                policyNode,
                graphNode,
                graph.Nodes,
                armIdToDiagramNodeId,
                removedDiagramNodeIds,
                emitPolicyEdges);
        }

        if (armResourceType?.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase) == true)
        {
            return TryPromoteNsgNode(
                ast,
                policyNode,
                graphNode,
                graph,
                armIdToDiagramNodeId,
                removedDiagramNodeIds,
                emitPolicyEdges);
        }

        return false;
    }

    private static bool TryPromoteRouteTableNode(
        DiagramAst ast,
        DiagramNode routeTableNode,
        GraphNode graphNode,
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        ISet<string> removedDiagramNodeIds,
        bool emitPolicyEdges)
    {
        Dictionary<string, string> properties = graphNode.Properties;
        IReadOnlyList<string> subnetArmIds = AzureInventoryRouteTableSubnetAssociationParser.Parse(properties);
        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);
        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(graphNode);
        int emittedEdgeCount = 0;

        foreach (string subnetArmId in subnetArmIds)
        {
            if (!armIdToDiagramNodeId.TryGetValue(subnetArmId, out string? subnetDiagramNodeId))
            {
                continue;
            }

            foreach (AzureInventoryRouteTableRoute route in routes)
            {
                string? nextHopArmId = AzureInventoryRouteTableNextHopResolver.Resolve(route, topologyNodes);

                if (string.IsNullOrWhiteSpace(nextHopArmId)
                    || !armIdToDiagramNodeId.TryGetValue(nextHopArmId, out string? nextHopDiagramNodeId))
                {
                    continue;
                }

                if (emitPolicyEdges)
                {
                    string edgeLabel = BuildRouteEdgeLabel(route);
                    ast.Edges.Add(new DiagramEdge
                    {
                        FromNodeId = subnetDiagramNodeId,
                        ToNodeId = nextHopDiagramNodeId,
                        Label = InventoryDiagramEvidenceCurrencyLabels.Format(evidenceCurrency, edgeLabel),
                        ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                        InferenceSource = GraphEdgeInferenceSources.InventoryRouteTableRoute,
                    });
                }

                emittedEdgeCount++;
            }
        }

        if (emittedEdgeCount == 0)
        {
            return false;
        }

        removedDiagramNodeIds.Add(routeTableNode.NodeId);
        return true;
    }

    private static bool TryPromoteNsgNode(
        DiagramAst ast,
        DiagramNode nsgNode,
        GraphNode graphNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        ISet<string> removedDiagramNodeIds,
        bool emitPolicyEdges)
    {
        Dictionary<string, string> properties = graphNode.Properties;
        IReadOnlyList<AzureInventoryNsgAssociation> associations = AzureInventoryNsgAssociationParser.Parse(properties);
        IReadOnlyList<AzureInventoryNsgSecurityRule> rules = AzureInventoryNsgSecurityRuleParser.Parse(properties);
        Dictionary<string, string> nicOwnerArmIdByNicArmId = BuildNicOwnerArmIdMap(graph);
        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(graphNode);
        int emittedEdgeCount = 0;

        foreach (AzureInventoryNsgAssociation association in associations)
        {
            if (string.IsNullOrWhiteSpace(association.TargetArmId))
            {
                continue;
            }

            string? endpointArmId = ResolveNsgAssociationEndpointArmId(association, nicOwnerArmIdByNicArmId);

            if (string.IsNullOrWhiteSpace(endpointArmId)
                || !armIdToDiagramNodeId.TryGetValue(endpointArmId, out string? endpointDiagramNodeId))
            {
                continue;
            }

            if (emitPolicyEdges)
            {
                string edgeLabel = BuildNsgAttachmentLabel(rules);
                ast.Edges.Add(new DiagramEdge
                {
                    FromNodeId = endpointDiagramNodeId,
                    ToNodeId = endpointDiagramNodeId,
                    Label = InventoryDiagramEvidenceCurrencyLabels.Format(evidenceCurrency, edgeLabel),
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                    InferenceSource = GraphEdgeInferenceSources.InventoryNsgPolicyAttachment,
                });
            }

            emittedEdgeCount++;
        }

        if (emittedEdgeCount == 0)
        {
            return false;
        }

        removedDiagramNodeIds.Add(nsgNode.NodeId);
        return true;
    }

    private static void PromoteWorkflowNode(
        DiagramAst ast,
        DiagramNode workflowNode,
        GraphNode graphNode,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId)
    {
        List<AzureInventoryWorkflowActionTarget> actions = graphNode.Properties
            .Where(pair => pair.Key.StartsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix,
                    StringComparison.OrdinalIgnoreCase)
                && pair.Key.EndsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix,
                    StringComparison.OrdinalIgnoreCase))
            .Select(pair =>
            {
                string actionName = pair.Key[
                    InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix.Length..^InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix.Length];

                return new AzureInventoryWorkflowActionTarget
                {
                    ActionName = actionName,
                    TargetArmId = pair.Value,
                };
            })
            .Where(action => !string.IsNullOrWhiteSpace(action.TargetArmId))
            .ToList();

        if (actions.Count == 0)
        {
            return;
        }

        string? workflowDiagramNodeId = workflowNode.NodeId;
        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(graphNode);

        foreach (AzureInventoryWorkflowActionTarget action in actions)
        {
            if (!armIdToDiagramNodeId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(action.TargetArmId),
                    out string? targetDiagramNodeId))
            {
                continue;
            }

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = workflowDiagramNodeId,
                ToNodeId = targetDiagramNodeId,
                Label = InventoryDiagramEvidenceCurrencyLabels.Format(evidenceCurrency, action.ActionName),
                ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                InferenceSource = GraphEdgeInferenceSources.InventoryWorkflowAction,
            });
        }
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

    private static string BuildRouteEdgeLabel(AzureInventoryRouteTableRoute route)
    {
        string addressPrefix = string.IsNullOrWhiteSpace(route.AddressPrefix) ? "*" : route.AddressPrefix.Trim();
        string nextHopType = string.IsNullOrWhiteSpace(route.NextHopType) ? "route" : route.NextHopType.Trim();

        return $"{addressPrefix} → {nextHopType}";
    }

    private static string BuildNsgAttachmentLabel(IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
        AzureInventoryNsgSecurityRule? firstRule = rules.FirstOrDefault();

        if (firstRule is null)
        {
            return "NSG attached";
        }

        string protocol = string.IsNullOrWhiteSpace(firstRule.Protocol) ? "*" : firstRule.Protocol.Trim();
        string port = string.IsNullOrWhiteSpace(firstRule.DestinationPortRange)
            ? string.IsNullOrWhiteSpace(firstRule.SourcePortRange) ? "*" : firstRule.SourcePortRange.Trim()
            : firstRule.DestinationPortRange.Trim();
        string direction = string.IsNullOrWhiteSpace(firstRule.Direction) ? "Any" : firstRule.Direction.Trim();
        string access = string.IsNullOrWhiteSpace(firstRule.Access) ? "Allow" : firstRule.Access.Trim();

        return $"NSG {protocol} {port} {direction} {access}";
    }

    private static string? ResolveNsgAssociationEndpointArmId(
        AzureInventoryNsgAssociation association,
        IReadOnlyDictionary<string, string> nicOwnerArmIdByNicArmId)
    {
        if (string.Equals(association.TargetKind, AzureInventoryNsgAssociationParser.SubnetKind, StringComparison.OrdinalIgnoreCase))
        {
            return association.TargetArmId;
        }

        if (string.Equals(association.TargetKind, AzureInventoryNsgAssociationParser.NicKind, StringComparison.OrdinalIgnoreCase)
            && association.TargetArmId is not null
            && nicOwnerArmIdByNicArmId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(association.TargetArmId),
                out string? ownerArmId))
        {
            return ownerArmId;
        }

        return null;
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

    private static string BuildConnectionEdgeLabel(
        string? connectionType,
        string endpoint1ArmId,
        string endpoint2ArmId)
    {
        string endpoint1Name = ReadResourceName(endpoint1ArmId);
        string endpoint2Name = ReadResourceName(endpoint2ArmId);
        string typeLabel = string.IsNullOrWhiteSpace(connectionType) ? "connection" : connectionType.Trim();

        return $"{typeLabel}: {endpoint1Name} ↔ {endpoint2Name}";
    }

    private static InventoryDiagramEvidenceCurrency ReadEvidenceCurrency(GraphNode graphNode)
    {
        if (graphNode.Properties.TryGetValue(
                InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency,
                out string? currencyValue)
            && Enum.TryParse(currencyValue, ignoreCase: true, out InventoryDiagramEvidenceCurrency parsed))
        {
            return parsed;
        }

        return InventoryDiagramEvidenceCurrency.Current;
    }

    private static string ResolveConnectionInferenceSource(string? armResourceType)
    {
        if (armResourceType?.Equals("Microsoft.Web/connections", StringComparison.OrdinalIgnoreCase) == true)
        {
            return GraphEdgeInferenceSources.InventoryLogicAppConnection;
        }

        return GraphEdgeInferenceSources.InventoryNetworkConnection;
    }

    private static string ReadResourceName(string armId)
    {
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armId.Length - 1)
        {
            return MermaidIdSanitizer.Sanitize(armId);
        }

        return armId[(lastSlash + 1)..];
    }
}
