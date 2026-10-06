using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Annotates proven data-flow connectors with effective NSG protocol, port, and blocked state (NR-08).
/// </summary>
internal static class InventoryDiagramDataFlowNsgAnnotationApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        bool retainNetworkDetailNodes = false)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Edges.Count == 0 || retainNetworkDetailNodes)
        {
            return;
        }

        Dictionary<string, string> diagramToGraphNodeId = ast.Nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.SeedNodeId))
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First().SeedNodeId!, StringComparer.Ordinal);

        Dictionary<string, DiagramNode> diagramNodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (TryApplyVmVnetInboundChipAnnotation(edge, diagramNodesById))
            {
                continue;
            }

            if (!diagramToGraphNodeId.TryGetValue(edge.FromNodeId, out string? sourceGraphNodeId)
                || !diagramToGraphNodeId.TryGetValue(edge.ToNodeId, out string? targetGraphNodeId))
            {
                continue;
            }

            InventoryDiagramDataFlowNsgConnectorAnnotation? annotation =
                InventoryDiagramDataFlowNsgEffectiveRuleReducer.Reduce(graph, sourceGraphNodeId, targetGraphNodeId);

            if (annotation is null || annotation.ConnectorDisplayLabels.Count == 0)
            {
                continue;
            }

            ApplyNsgConnectorAnnotation(edge, annotation);
        }
    }

    private static bool TryApplyVmVnetInboundChipAnnotation(
        DiagramEdge edge,
        IReadOnlyDictionary<string, DiagramNode> diagramNodesById)
    {
        if (!TryResolveVirtualMachineVnetEndpoints(edge, diagramNodesById, out DiagramNode? virtualMachineNode))
        {
            return false;
        }

        if (virtualMachineNode is null || virtualMachineNode.NsgInboundRuleChips.Count == 0)
        {
            return false;
        }

        List<string> chipLabels = virtualMachineNode.NsgInboundRuleChips
            .Select(chip => chip.Text)
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .ToList();

        if (chipLabels.Count == 0)
        {
            return false;
        }

        edge.DataFlowNsgAnnotationLabels = chipLabels;
        string annotationText = string.Join(" · ", chipLabels);

        if (string.IsNullOrWhiteSpace(edge.Label))
        {
            edge.Label = annotationText;
        }
        else if (!edge.Label.Contains(annotationText, StringComparison.Ordinal))
        {
            edge.Label = $"{edge.Label} · {annotationText}";
        }

        return true;
    }

    private static bool TryResolveVirtualMachineVnetEndpoints(
        DiagramEdge edge,
        IReadOnlyDictionary<string, DiagramNode> diagramNodesById,
        out DiagramNode? virtualMachineNode)
    {
        virtualMachineNode = null;

        if (!diagramNodesById.TryGetValue(edge.FromNodeId, out DiagramNode? fromNode)
            || !diagramNodesById.TryGetValue(edge.ToNodeId, out DiagramNode? toNode))
        {
            return false;
        }

        if (IsVirtualMachineDiagramNode(fromNode) && IsVirtualNetworkDiagramNode(toNode))
        {
            virtualMachineNode = fromNode;
            return true;
        }

        if (IsVirtualMachineDiagramNode(toNode) && IsVirtualNetworkDiagramNode(fromNode))
        {
            virtualMachineNode = toNode;
            return true;
        }

        return false;
    }

    private static bool IsVirtualMachineDiagramNode(DiagramNode node)
    {
        return !string.IsNullOrWhiteSpace(node.ArmResourceType)
            && node.ArmResourceType.Contains("/virtualMachines", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsVirtualNetworkDiagramNode(DiagramNode node)
    {
        return string.Equals(
            node.ArmResourceType,
            "Microsoft.Network/virtualNetworks",
            StringComparison.OrdinalIgnoreCase);
    }

    private static void ApplyNsgConnectorAnnotation(
        DiagramEdge edge,
        InventoryDiagramDataFlowNsgConnectorAnnotation annotation)
    {
        edge.IsDataFlowNsgBlocked = annotation.IsBlocked;
        edge.DataFlowNsgAnnotationLabels = annotation.ConnectorDisplayLabels.ToList();
        edge.DataFlowNsgSupportingRuleDetails = annotation.SupportingRuleDetailLines.ToList();

        string annotationText = string.Join(" · ", annotation.ConnectorDisplayLabels);

        if (string.IsNullOrWhiteSpace(edge.Label))
        {
            edge.Label = annotationText;
        }
        else if (!edge.Label.Contains(annotationText, StringComparison.Ordinal))
        {
            edge.Label = $"{edge.Label} · {annotationText}";
        }
    }
}
