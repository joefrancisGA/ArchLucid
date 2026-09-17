using System.Text;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
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
        IReadOnlyList<DiagramResourceGroupGraphvizClusterPlanner.ClusterPlan> resourceGroupClusters =
            DiagramResourceGroupGraphvizClusterPlanner.Plan(ast);
        HashSet<string> resourceGroupClusteredNodeIds =
            DiagramResourceGroupGraphvizClusterPlanner.ResolveClusteredNodeIds(resourceGroupClusters);

        builder.AppendLine($"digraph {resolvedOptions.DigraphName} {{");
        builder.AppendLine($"    graph [layout={resolvedOptions.LayoutEngine}, overlap=false, sep=\"+36,28\", K=1.8, pack=true, packmode=graph, splines=true, outputorder=edgesfirst];");
        builder.AppendLine(
            "    node [shape=box, style=filled, fontname=\"DejaVu Sans\", "
            + $"fillcolor=\"{ArchitectureDiagramMermaidPalette.LightNodeFill}\", "
            + $"color=\"{ArchitectureDiagramMermaidPalette.LightNodeBorder}\", "
            + $"fontcolor=\"{ArchitectureDiagramMermaidPalette.LightNodeText}\"];");
        builder.AppendLine(
            $"    edge [color=\"{ArchitectureDiagramMermaidPalette.LightEdgeStroke}\"];");

        foreach (DiagramResourceGroupGraphvizClusterPlanner.ClusterPlan cluster in resourceGroupClusters)
        {
            EmitResourceGroupCluster(builder, cluster, indent: 1);
        }

        if (renderableSubgraphs.Count == 0)
        {
            EmitFlatNodes(ast, builder, indent: 1, excludedNodeIds: resourceGroupClusteredNodeIds);
        }
        else
        {
            EmitNestedGraph(ast, builder, renderableSubgraphs, resourceGroupClusteredNodeIds);
        }

        EmitVisibleEdges(ast, builder);

        builder.Append('}');

        return builder.ToString();
    }

    private static void EmitFlatNodes(
        DiagramAst ast,
        StringBuilder builder,
        int indent,
        HashSet<string> excludedNodeIds)
    {
        string indentText = new(' ', indent * 4);

        foreach (DiagramNode node in ast.Nodes
                     .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
                     .Where(node => !excludedNodeIds.Contains(node.NodeId))
                     .OrderBy(candidate => candidate.OrderKey)
                     .ThenBy(candidate => candidate.NodeId, StringComparer.Ordinal))
        {
            AppendNodeStatement(builder, indentText, node);
        }
    }

    private static void EmitNestedGraph(
        DiagramAst ast,
        StringBuilder builder,
        IReadOnlyList<DiagramSubgraph> renderableSubgraphs,
        HashSet<string> excludedNodeIds)
    {
        HashSet<string> renderedSubgraphs = new(StringComparer.Ordinal);
        Dictionary<string, DiagramSubgraph> subgraphById = renderableSubgraphs.ToDictionary(
            subgraph => subgraph.SubgraphId,
            StringComparer.Ordinal);

        List<DiagramNode> rootNodes = ast.Nodes
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .Where(node => !excludedNodeIds.Contains(node.NodeId))
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
            EmitSubgraphTree(ast, builder, rootSubgraph, subgraphById, renderedSubgraphs, excludedNodeIds, indent: 1);
        }
    }

    private static void EmitSubgraphTree(
        DiagramAst ast,
        StringBuilder builder,
        DiagramSubgraph subgraph,
        Dictionary<string, DiagramSubgraph> subgraphById,
        HashSet<string> renderedSubgraphs,
        HashSet<string> excludedNodeIds,
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
        builder.AppendLine($"{indentText}    labelloc=t;");
        builder.AppendLine($"{indentText}    labeljust=l;");
        builder.AppendLine($"{indentText}    margin=\"18,12\";");

        foreach (DiagramNode node in ast.Nodes
                     .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
                     .Where(node => !excludedNodeIds.Contains(node.NodeId))
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
            EmitSubgraphTree(ast, builder, child, subgraphById, renderedSubgraphs, excludedNodeIds, indent + 1);
        }

        builder.AppendLine($"{indentText}}}");
    }

    private static void EmitResourceGroupCluster(
        StringBuilder builder,
        DiagramResourceGroupGraphvizClusterPlanner.ClusterPlan cluster,
        int indent)
    {
        string indentText = new(' ', indent * 4);
        string clusterId = "cluster_" + GraphvizIdEscaper.SanitizeClusterId(cluster.ClusterId);
        string clusterLabel = GraphvizIdEscaper.QuoteLabel(cluster.GroupName);

        builder.AppendLine($"{indentText}subgraph {clusterId} {{");
        builder.AppendLine($"{indentText}    label={clusterLabel};");
        builder.AppendLine($"{indentText}    style=\"rounded,filled\";");
        builder.AppendLine($"{indentText}    color=\"{ArchitectureDiagramMermaidPalette.LightResourceGroupFrameStroke}\";");
        builder.AppendLine($"{indentText}    penwidth=2;");
        builder.AppendLine($"{indentText}    fillcolor=\"{DiagramForestResourceGroupFrameStyle.Fill}\";");
        builder.AppendLine($"{indentText}    fontcolor=\"{DiagramForestResourceGroupFrameStyle.LabelFill}\";");

        foreach (DiagramNode node in cluster.Nodes
                     .OrderBy(candidate => candidate.OrderKey)
                     .ThenBy(candidate => candidate.NodeId, StringComparer.Ordinal))
        {
            AppendNodeStatement(builder, indentText + "    ", node);
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
            DiagramEdgeVisualKind visualKind = DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource);
            string styleAttribute = ResolveGraphvizEdgeStyle(visualKind);

            if (string.IsNullOrWhiteSpace(label))
            {
                if (string.IsNullOrEmpty(styleAttribute))
                {
                    builder.AppendLine($"    {fromId} -> {toId};");
                }
                else
                {
                    builder.AppendLine($"    {fromId} -> {toId} [{styleAttribute}];");
                }

                continue;
            }

            if (string.IsNullOrEmpty(styleAttribute))
            {
                builder.AppendLine($"    {fromId} -> {toId} [label={GraphvizIdEscaper.QuoteLabel(label)}];");
            }
            else
            {
                builder.AppendLine(
                    $"    {fromId} -> {toId} [{styleAttribute}, label={GraphvizIdEscaper.QuoteLabel(label)}];");
            }
        }
    }

    private static string ResolveGraphvizEdgeStyle(DiagramEdgeVisualKind visualKind) =>
        visualKind switch
        {
            DiagramEdgeVisualKind.Declared => "style=dashed, color=\"#64748b\"",
            DiagramEdgeVisualKind.AiInferred => "style=dotted, color=\"#64748b\"",
            _ => string.Empty,
        };
}
