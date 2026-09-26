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
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Edges.Count == 0)
        {
            return;
        }

        Dictionary<string, string> diagramToGraphNodeId = ast.Nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.SeedNodeId))
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First().SeedNodeId!, StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
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
}
