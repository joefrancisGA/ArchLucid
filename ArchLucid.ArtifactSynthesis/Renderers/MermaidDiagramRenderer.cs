using System.Text;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Sanitization;

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
        string metadataComment = BuildInventoryNodeMetadataComment(node);

        if (!string.IsNullOrEmpty(metadataComment))
        {
            // Mermaid flowcharts only strip %% comments that start a line. An inline
            // comment after id["label"] is lexed as NODE_STRING and fails parse.
            sb.AppendLine($"{indentText}{metadataComment}");
        }

        sb.AppendLine($"{indentText}{safeNodeId}[\"{safeLabel}\"]");
    }

    private static string BuildInventoryNodeMetadataComment(DiagramNode node)
    {
        List<string> tokens = [];

        if (!string.IsNullOrWhiteSpace(node.ArmResourceType))
        {
            tokens.Add($"al-type={QuoteMetadataValue(node.ArmResourceType)}");
        }

        if (!string.IsNullOrWhiteSpace(node.ArmResourceGroup))
        {
            tokens.Add($"al-rg={QuoteMetadataValue(node.ArmResourceGroup)}");
        }

        if (!string.IsNullOrWhiteSpace(node.SeedNodeId))
        {
            tokens.Add($"al-seed={QuoteMetadataValue(node.SeedNodeId)}");
        }

        if (tokens.Count == 0)
        {
            return string.Empty;
        }

        return $"%% {string.Join(' ', tokens)}";
    }

    private static string QuoteMetadataValue(string value)
    {
        string trimmed = value.Trim();

        if (trimmed.Length == 0)
        {
            return "\"\"";
        }

        if (!trimmed.Contains('"', StringComparison.Ordinal) && !trimmed.Contains(' ', StringComparison.Ordinal))
        {
            return trimmed;
        }

        return "\"" + trimmed.Replace("\"", "\\\"", StringComparison.Ordinal) + "\"";
    }

    private static void AppendEdges(DiagramAst ast, StringBuilder sb)
    {
        foreach (DiagramEdge edge in ast.Edges)
        {
            string safeLabel = EscapeLabel(edge.Label);
            string fromId = MermaidIdSanitizer.Sanitize(edge.FromNodeId);
            string toId = MermaidIdSanitizer.Sanitize(edge.ToNodeId);

            if (string.IsNullOrWhiteSpace(safeLabel))
            {
                sb.AppendLine($"    {fromId} --> {toId}");
            }
            else
            {
                sb.AppendLine($"    {fromId} -->|\"{safeLabel}\"| {toId}");
            }
        }
    }

    internal static string EscapeLabel(string label)
    {
        return LlmArtifactFreeTextSanitizer.Sanitize(label)
            .Replace("\r\n", " ", StringComparison.Ordinal)
            .Replace('\n', ' ')
            .Replace('\r', ' ')
            .Replace("\"", "'", StringComparison.Ordinal)
            .Replace("[", "#91;", StringComparison.Ordinal)
            .Replace("]", "#93;", StringComparison.Ordinal)
            .Replace("|", "#124;", StringComparison.Ordinal);
    }
}
