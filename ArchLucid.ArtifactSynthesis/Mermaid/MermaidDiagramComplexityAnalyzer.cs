using System.Text;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramComplexityAnalyzer : IMermaidDiagramComplexityAnalyzer
{
    public MermaidDiagramComplexityMetrics Analyze(DiagramAst ast, string? renderedMermaid)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, int> degree = new(StringComparer.Ordinal);

        foreach (DiagramNode node in ast.Nodes)
        {
            degree.TryAdd(node.NodeId, 0);
        }

        int crossSubgraphEdges = 0;

        foreach (DiagramEdge edge in ast.Edges)
        {
            IncrementDegree(degree, edge.FromNodeId);
            IncrementDegree(degree, edge.ToNodeId);

            DiagramNode? from = ast.Nodes.FirstOrDefault(node => node.NodeId == edge.FromNodeId);
            DiagramNode? to = ast.Nodes.FirstOrDefault(node => node.NodeId == edge.ToNodeId);

            if (from is not null && to is not null
                && !string.IsNullOrWhiteSpace(from.SubgraphId)
                && !string.IsNullOrWhiteSpace(to.SubgraphId)
                && !string.Equals(from.SubgraphId, to.SubgraphId, StringComparison.Ordinal))
            {
                crossSubgraphEdges++;
            }
        }

        int textSize = renderedMermaid is null ? 0 : Encoding.UTF8.GetByteCount(renderedMermaid);
        int maxDegree = degree.Count == 0 ? 0 : degree.Values.Max();
        int layoutEstimate = ast.Nodes.Count * 8 + ast.Edges.Count * 12 + ast.Subgraphs.Count * 20 + textSize;

        return new MermaidDiagramComplexityMetrics
        {
            NodeCount = ast.Nodes.Count,
            EdgeCount = ast.Edges.Count,
            SubgraphCount = ast.Subgraphs.Count,
            MaxDegree = maxDegree,
            CrossSubgraphEdgeCount = crossSubgraphEdges,
            TextSizeBytes = textSize,
            LayoutEstimate = layoutEstimate,
        };
    }

    private static void IncrementDegree(Dictionary<string, int> degree, string nodeId)
    {
        if (!degree.ContainsKey(nodeId))
        {
            degree[nodeId] = 0;
        }

        degree[nodeId]++;
    }
}
