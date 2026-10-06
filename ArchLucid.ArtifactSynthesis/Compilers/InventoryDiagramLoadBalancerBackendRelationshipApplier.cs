using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Draws Sends traffic to lines from load balancers and application gateways (NR-25).</summary>
internal static class InventoryDiagramLoadBalancerBackendRelationshipApplier
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

        foreach (GraphNode graphNode in graph.Nodes)
        {
            if (!graphToDiagramNodeId.TryGetValue(graphNode.NodeId, out string? frontDiagramNodeId))
            {
                continue;
            }

            string armType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);
            IReadOnlyList<AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget> backendTargets = [];

            if (armType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase))
            {
                backendTargets = AzureInventoryLoadBalancerBackendTrafficResolver.ResolveLoadBalancerBackends(graphNode);
            }
            else if (armType.Contains("applicationGateways", StringComparison.OrdinalIgnoreCase))
            {
                backendTargets = AzureInventoryLoadBalancerBackendTrafficResolver.ResolveApplicationGatewayBackends(graphNode);
            }
            else
            {
                continue;
            }

            foreach (AzureInventoryLoadBalancerBackendTrafficResolver.BackendTarget backendTarget in backendTargets)
            {
                string? backendDiagramNodeId = ResolveBackendDiagramNodeId(
                    backendTarget.TargetArmId,
                    armIdToDiagramNodeId,
                    nicArmIdToOwnerArmId);

                if (string.IsNullOrWhiteSpace(backendDiagramNodeId))
                {
                    continue;
                }

                string label = InventoryDiagramRelationshipLabelTexts.FormatSendsTrafficTo(backendTarget.RulePort);
                InventoryDiagramRelationshipEdgeHelper.RemoveGenericEdgesBetween(ast, frontDiagramNodeId, backendDiagramNodeId);
                InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                    ast,
                    frontDiagramNodeId,
                    backendDiagramNodeId,
                    label,
                    GraphEdgeInferenceSources.InventoryLbBackend,
                    ProvenanceKind.ObservedFact.ToString());
            }
        }
    }

    private static string? ResolveBackendDiagramNodeId(
        string backendArmId,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        string normalizedBackendArmId = ArmResourceIdNormalizer.Normalize(backendArmId);

        if (nicArmIdToOwnerArmId.TryGetValue(normalizedBackendArmId, out string? ownerArmId)
            && armIdToDiagramNodeId.TryGetValue(ownerArmId, out string? ownerDiagramNodeId))
        {
            return ownerDiagramNodeId;
        }

        if (armIdToDiagramNodeId.TryGetValue(normalizedBackendArmId, out string? diagramNodeId))
        {
            return diagramNodeId;
        }

        return null;
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
}
