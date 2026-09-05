using System.Text;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Renderers;

public class MermaidDiagramRenderer : IDiagramRenderer
{
    public string Format => "mermaid";

    public string Render(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        StringBuilder sb = new();
        sb.AppendLine("flowchart TD");

        if (ast.Subgraphs.Count == 0)
        {
            RenderFlatGraph(ast, sb);
            return sb.ToString();
        }

        Dictionary<string, DiagramSubgraph> subgraphById = ast.Subgraphs.ToDictionary(
            subgraph => subgraph.SubgraphId,
            StringComparer.Ordinal);

        HashSet<string> renderedSubgraphs = new(StringComparer.Ordinal);
        List<DiagramNode> rootNodes = ast.Nodes
            .Where(node => string.IsNullOrWhiteSpace(node.SubgraphId))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        foreach (DiagramNode node in rootNodes)
        {
            AppendNodeLine(sb, node, indent: 1);
        }

        foreach (DiagramSubgraph rootSubgraph in ast.Subgraphs
                     .Where(subgraph => string.IsNullOrWhiteSpace(subgraph.ParentSubgraphId))
                     .OrderBy(subgraph => subgraph.OrderKey)
                     .ThenBy(subgraph => subgraph.SubgraphId, StringComparer.Ordinal))
        {
            RenderSubgraphTree(ast, sb, rootSubgraph, subgraphById, renderedSubgraphs, indent: 1);
        }

        AppendEdges(ast, sb);

        return sb.ToString();
    }

    private static void RenderFlatGraph(DiagramAst ast, StringBuilder sb)
    {
        foreach (DiagramNode node in ast.Nodes.OrderBy(n => n.OrderKey).ThenBy(n => n.NodeId, StringComparer.Ordinal))
        {
            AppendNodeLine(sb, node, indent: 1);
        }

        AppendEdges(ast, sb);
    }

    private static void RenderSubgraphTree(
        DiagramAst ast,
        StringBuilder sb,
        DiagramSubgraph subgraph,
        Dictionary<string, DiagramSubgraph> subgraphById,
        HashSet<string> renderedSubgraphs,
        int indent)
    {
        if (!renderedSubgraphs.Add(subgraph.SubgraphId))
        {
            return;
        }

        string indentText = new(' ', indent * 4);
        string safeSubgraphId = MermaidIdSanitizer.Sanitize(subgraph.SubgraphId);
        string safeLabel = EscapeLabel(subgraph.Label);
        sb.AppendLine($"{indentText}subgraph {safeSubgraphId}[\"{safeLabel}\"]");

        foreach (DiagramNode node in ast.Nodes
                     .Where(node => string.Equals(node.SubgraphId, subgraph.SubgraphId, StringComparison.Ordinal))
                     .OrderBy(node => node.OrderKey)
                     .ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            AppendNodeLine(sb, node, indent + 1);
        }

        foreach (DiagramSubgraph child in ast.Subgraphs
                     .Where(candidate => string.Equals(candidate.ParentSubgraphId, subgraph.SubgraphId, StringComparison.Ordinal))
                     .OrderBy(candidate => candidate.OrderKey)
                     .ThenBy(candidate => candidate.SubgraphId, StringComparer.Ordinal))
        {
            RenderSubgraphTree(ast, sb, child, subgraphById, renderedSubgraphs, indent + 1);
        }

        sb.AppendLine($"{indentText}end");
    }

    private static void AppendNodeLine(StringBuilder sb, DiagramNode node, int indent)
    {
        string indentText = new(' ', indent * 4);
        string safeNodeId = MermaidIdSanitizer.Sanitize(node.NodeId);
        string safeLabel = EscapeLabel(node.Label);
        sb.AppendLine($"{indentText}{safeNodeId}[\"{safeLabel}\"]");
    }

    private static void AppendEdges(DiagramAst ast, StringBuilder sb)
    {
        foreach (DiagramEdge edge in ast.Edges)
        {
            string safeLabel = EscapeLabel(edge.Label);
            string fromId = MermaidIdSanitizer.Sanitize(edge.FromNodeId);
            string toId = MermaidIdSanitizer.Sanitize(edge.ToNodeId);
            sb.AppendLine($"    {fromId} -->|\"{safeLabel}\"| {toId}");
        }
    }

    internal static string EscapeLabel(string label)
    {
        return label.Replace("\"", "'", StringComparison.Ordinal);
    }
}
