using System.Text;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

public sealed class DiagramAstGraphvizDotEmitter : IDiagramAstGraphvizDotEmitter
{
    public string Emit(DiagramAst ast, GraphvizDotEmitOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(ast);

        GraphvizDotEmitOptions resolvedOptions = options ?? new GraphvizDotEmitOptions();
        StringBuilder builder = new();
        List<DiagramSubgraph> renderableSubgraphs = ast.Subgraphs
            .Where(subgraph => !DiagramSparseComponentPacker.IsPackingSubgraph(subgraph))
            .OrderBy(subgraph => subgraph.OrderKey)
            .ThenBy(subgraph => subgraph.SubgraphId, StringComparer.Ordinal)
            .ToList();

        builder.AppendLine($"digraph {resolvedOptions.DigraphName} {{");
        builder.AppendLine($"    graph [layout={resolvedOptions.LayoutEngine}, overlap=false, sep=\"+36,28\", K=1.8, pack=true, packmode=graph, splines=true, outputorder=edgesfirst];");
        builder.AppendLine(
            "    node [shape=box, style=filled, fontname=\"DejaVu Sans\", "
            + $"fillcolor=\"{ArchitectureDiagramMermaidPalette.LightNodeFill}\", "
            + $"color=\"{ArchitectureDiagramMermaidPalette.LightNodeBorder}\", "
            + $"fontcolor=\"{ArchitectureDiagramMermaidPalette.LightNodeText}\"];");

        if (renderableSubgraphs.Count == 0)
        {
            EmitFlatNodes(ast, builder, indent: 1);
        }
        else
        {
            EmitNestedGraph(ast, builder, renderableSubgraphs);
        }

        EmitVisibleEdges(ast, builder);

        builder.Append('}');

        return builder.ToString();
    }

    private static void EmitFlatNodes(DiagramAst ast, StringBuilder builder, int indent)
    {
        string indentText = new(' ', indent * 4);

        foreach (DiagramNode node in ast.Nodes
                     .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
                     .OrderBy(candidate => candidate.OrderKey)
                     .ThenBy(candidate => candidate.NodeId, StringComparer.Ordinal))
        {
            AppendNodeStatement(builder, indentText, node);
        }
    }

    private static void EmitNestedGraph(
        DiagramAst ast,
        StringBuilder builder,
        IReadOnlyList<DiagramSubgraph> renderableSubgraphs)
    {
        HashSet<string> renderedSubgraphs = new(StringComparer.Ordinal);
        Dictionary<string, DiagramSubgraph> subgraphById = renderableSubgraphs.ToDictionary(
            subgraph => subgraph.SubgraphId,
            StringComparer.Ordinal);

        List<DiagramNode> rootNodes = ast.Nodes
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .Where(node => string.IsNullOrWhiteSpace(node.SubgraphId)
                || !subgraphById.ContainsKey(node.SubgraphId))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        foreach (DiagramNode node in rootNodes)
        {
            AppendNodeStatement(builder, "    ", node);
        }

        foreach (DiagramSubgraph rootSubgraph in renderableSubgraphs
                     .Where(subgraph => string.IsNullOrWhiteSpace(subgraph.ParentSubgraphId)
                         || !subgraphById.ContainsKey(subgraph.ParentSubgraphId))
                     .OrderBy(subgraph => subgraph.OrderKey)
                     .ThenBy(subgraph => subgraph.SubgraphId, StringComparer.Ordinal))
        {
            EmitSubgraphTree(ast, builder, rootSubgraph, subgraphById, renderedSubgraphs, indent: 1);
        }
    }

    private static void EmitSubgraphTree(
        DiagramAst ast,
        StringBuilder builder,
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
        string clusterId = "cluster_" + GraphvizIdEscaper.SanitizeClusterId(subgraph.SubgraphId);
        string clusterLabel = string.IsNullOrWhiteSpace(subgraph.Label)
            ? "\" \""
            : GraphvizIdEscaper.QuoteLabel(subgraph.Label);

        builder.AppendLine($"{indentText}subgraph {clusterId} {{");
        builder.AppendLine($"{indentText}    label={clusterLabel};");

        foreach (DiagramNode node in ast.Nodes
                     .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
                     .Where(node => string.Equals(node.SubgraphId, subgraph.SubgraphId, StringComparison.Ordinal))
                     .OrderBy(node => node.OrderKey)
                     .ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            AppendNodeStatement(builder, indentText + "    ", node);
        }

        foreach (DiagramSubgraph child in subgraphById.Values
                     .Where(candidate => string.Equals(candidate.ParentSubgraphId, subgraph.SubgraphId, StringComparison.Ordinal))
                     .OrderBy(candidate => candidate.OrderKey)
                     .ThenBy(candidate => candidate.SubgraphId, StringComparer.Ordinal))
        {
            EmitSubgraphTree(ast, builder, child, subgraphById, renderedSubgraphs, indent + 1);
        }

        builder.AppendLine($"{indentText}}}");
    }

    private static void AppendNodeStatement(StringBuilder builder, string indentText, DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string graphvizId = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(node.NodeId));
        string label = DiagramGraphvizHtmlNodeLabel.Format(node);
        builder.AppendLine($"{indentText}{graphvizId} [label={label}];");
    }

    private static void EmitVisibleEdges(DiagramAst ast, StringBuilder builder)
    {
        foreach (DiagramEdge edge in DiagramExecutiveOverflowCanvasExclusion.CanvasVisibleEdges(ast.Nodes, ast.Edges))
        {
            string fromId = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(edge.FromNodeId));
            string toId = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(edge.ToNodeId));
            string label = MermaidDiagramRenderer.EscapeLabel(edge.Label);

            if (string.IsNullOrWhiteSpace(label))
            {
                builder.AppendLine($"    {fromId} -> {toId};");
            }
            else
            {
                builder.AppendLine($"    {fromId} -> {toId} [label={GraphvizIdEscaper.QuoteLabel(label)}];");
            }
        }
    }
}
