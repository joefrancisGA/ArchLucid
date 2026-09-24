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

        bool emitSubscriptionCluster = DiagramForestSubscriptionFrameResolver.ShouldDraw(ast.Title)
            && resourceGroupClusters.Count > 0;

        if (emitSubscriptionCluster)
        {
            builder.AppendLine("    subgraph cluster_subscription {");
            builder.AppendLine("        label=\"Subscription\";");
            builder.AppendLine("        style=\"rounded\";");
            builder.AppendLine("        color=\"#475569\";");
            builder.AppendLine("        penwidth=2.5;");
        }

        foreach (DiagramResourceGroupGraphvizClusterPlanner.ClusterPlan cluster in resourceGroupClusters)
        {
            EmitResourceGroupCluster(builder, cluster, emitSubscriptionCluster ? 2 : 1, ast);
        }

        if (emitSubscriptionCluster)
        {
            builder.AppendLine("    }");
        }

        if (renderableSubgraphs.Count == 0)
        {
            EmitFlatNodes(ast, builder, indent: 1, excludedNodeIds: resourceGroupClusteredNodeIds);
        }
        else
        {
            EmitNestedGraph(ast, builder, renderableSubgraphs, resourceGroupClusteredNodeIds);
        }

        EmitVisibleEdges(ast, builder, resolvedOptions.IncludeCrossGroupFanOut);

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

        if (!SubgraphTreeHasVisibleContent(ast, subgraph, subgraphById, excludedNodeIds))
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

    private static bool SubgraphTreeHasVisibleContent(
        DiagramAst ast,
        DiagramSubgraph subgraph,
        Dictionary<string, DiagramSubgraph> subgraphById,
        HashSet<string> excludedNodeIds)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(subgraph);
        ArgumentNullException.ThrowIfNull(subgraphById);
        ArgumentNullException.ThrowIfNull(excludedNodeIds);

        bool hasVisibleNode = ast.Nodes
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .Where(node => node is not null && !excludedNodeIds.Contains(node.NodeId))
            .Any(node => string.Equals(node.SubgraphId, subgraph.SubgraphId, StringComparison.Ordinal));

        if (hasVisibleNode)
        {
            return true;
        }

        return subgraphById.Values.Any(candidate =>
            candidate is not null
            && string.Equals(candidate.ParentSubgraphId, subgraph.SubgraphId, StringComparison.Ordinal)
            && SubgraphTreeHasVisibleContent(ast, candidate, subgraphById, excludedNodeIds));
    }

    private static void EmitResourceGroupCluster(
        StringBuilder builder,
        DiagramResourceGroupGraphvizClusterPlanner.ClusterPlan cluster,
        int indent,
        DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(cluster);
        ArgumentException.ThrowIfNullOrWhiteSpace(cluster.ClusterId);
        ArgumentNullException.ThrowIfNull(cluster.Nodes);

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

        IReadOnlyList<DiagramResourceGroupGraphvizClusterPlanner.VnetClusterPlan> vnetClusters =
            DiagramResourceGroupGraphvizClusterPlanner.PlanVnetClusters(ast, cluster);
        HashSet<string> nestedNodeIds = vnetClusters
            .SelectMany(vnetCluster => vnetCluster.Nodes)
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramResourceGroupGraphvizClusterPlanner.VnetClusterPlan vnetCluster in vnetClusters)
        {
            string nestedClusterId = "cluster_" + GraphvizIdEscaper.SanitizeClusterId(vnetCluster.ClusterId);
            builder.AppendLine($"{indentText}    subgraph {nestedClusterId} {{");
            builder.AppendLine($"{indentText}        label={GraphvizIdEscaper.QuoteLabel(vnetCluster.Label)};");
            builder.AppendLine($"{indentText}        style=\"rounded\";");
            builder.AppendLine($"{indentText}        color=\"#94a3b8\";");
            builder.AppendLine($"{indentText}        penwidth=1.5;");
            builder.AppendLine($"{indentText}        fillcolor=\"white\";");

            foreach (DiagramNode node in vnetCluster.Nodes.Where(node => node.NodeId != vnetCluster.VnetNodeId))
            {
                AppendNodeStatement(builder, indentText + "        ", node);
            }

            builder.AppendLine($"{indentText}    }}");
        }

        foreach (DiagramNode node in cluster.Nodes
                     .Where(candidate => candidate is not null)
                     .Where(candidate => !nestedNodeIds.Contains(candidate.NodeId))
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

    private static void EmitVisibleEdges(DiagramAst ast, StringBuilder builder, bool includeCrossGroupFanOut)
    {
        IReadOnlyList<DiagramNode> renderableNodes = ast.Nodes
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .ToList();

        foreach (DiagramEdge edge in DiagramCrossGroupFanOutCanvasExclusion.FilterCanvasEdges(
                     renderableNodes,
                     DiagramExecutiveOverflowCanvasExclusion.CanvasVisibleEdges(ast.Nodes, ast.Edges),
                     includeCrossGroupFanOut))
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
            DiagramEdgeVisualKind.Probable => "style=dashed, color=\"#64748b\"",
            DiagramEdgeVisualKind.AiInferred => "style=dotted, color=\"#64748b\"",
            DiagramEdgeVisualKind.Inferred => "style=dotted, color=\"#64748b\"",
            _ => string.Empty,
        };
}
