using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Projects cited traversal hops onto data-flow diagram edges in traversal order (NR-07).
/// </summary>
internal static class InventoryDiagramDataFlowTraversalHopApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyList<GraphEdge> dataFlowEdges)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);
        ArgumentNullException.ThrowIfNull(dataFlowEdges);

        if (ast.Nodes.Count == 0 || dataFlowEdges.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        IReadOnlyList<InventoryDiagramDataFlowTraversalHopPath> paths =
            InventoryDiagramDataFlowTraversalHopProjector.ProjectDataFlowEdgePaths(graph, dataFlowEdges);

        if (paths.Count == 0)
        {
            return;
        }

        HashSet<string> edgesToRemove = new(StringComparer.Ordinal);
        List<DiagramEdge> edgesToAdd = [];
        HashSet<string> addedEdgeKeys = new(StringComparer.Ordinal);

        foreach (InventoryDiagramDataFlowTraversalHopPath path in paths)
        {
            if (!graphToDiagramNodeId.TryGetValue(path.SourceNodeId, out string? sourceDiagramNodeId)
                || !graphToDiagramNodeId.TryGetValue(path.TargetNodeId, out string? targetDiagramNodeId))
            {
                continue;
            }

            if (path.OrderedHopNodeIds.Count == 0 || path.OrderedLinks.Count == 0)
            {
                continue;
            }

            edgesToRemove.Add(BuildEdgeKey(sourceDiagramNodeId, targetDiagramNodeId));

            if (path.HasUnresolvedGap)
            {
                DiagramNode? terminalDiagramNode = FindDiagramNodeForGraphNodeId(
                    ast,
                    graphToDiagramNodeId,
                    path.OrderedHopNodeIds[^1]);

                if (terminalDiagramNode is not null)
                {
                    string gapDetail = path.MissingHopDescription!;

                    if (!terminalDiagramNode.UnresolvedRelationshipDetails.Contains(gapDetail, StringComparer.Ordinal))
                    {
                        terminalDiagramNode.UnresolvedRelationshipDetails.Add(gapDetail);
                    }
                }
            }

            if (path.HasUnresolvedGap && !path.ReachesTarget)
            {
                AddTraversalEdges(
                    path,
                    graphToDiagramNodeId,
                    graphNodesById,
                    edgesToAdd,
                    addedEdgeKeys,
                    includeTerminalHopToTarget: false);
                continue;
            }

            AddTraversalEdges(
                path,
                graphToDiagramNodeId,
                graphNodesById,
                edgesToAdd,
                addedEdgeKeys,
                includeTerminalHopToTarget: true,
                targetDiagramNodeId);
        }

        if (edgesToRemove.Count == 0 && edgesToAdd.Count == 0)
        {
            return;
        }

        ast.Edges.RemoveAll(edge =>
            !edge.IsLayoutOnly
            && edgesToRemove.Contains(BuildEdgeKey(edge.FromNodeId, edge.ToNodeId)));

        foreach (DiagramEdge edge in edgesToAdd)
        {
            ast.Edges.Add(edge);
        }

        ApplyHopEvidence(ast, graph, graphNodesById);
    }

    private static void AddTraversalEdges(
        InventoryDiagramDataFlowTraversalHopPath path,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<DiagramEdge> edgesToAdd,
        HashSet<string> addedEdgeKeys,
        bool includeTerminalHopToTarget,
        string? targetDiagramNodeId = null)
    {
        string currentDiagramNodeId = graphToDiagramNodeId[path.SourceNodeId];

        foreach (InventoryDiagramDataFlowTraversalHopLink link in path.OrderedLinks)
        {
            if (!graphToDiagramNodeId.TryGetValue(link.ToNodeId, out string? nextDiagramNodeId))
            {
                break;
            }

            bool isTerminalLink = string.Equals(link.ToNodeId, path.TargetNodeId, StringComparison.Ordinal);

            if (isTerminalLink && !includeTerminalHopToTarget)
            {
                break;
            }

            string edgeKey = BuildEdgeKey(currentDiagramNodeId, nextDiagramNodeId);

            if (addedEdgeKeys.Add(edgeKey))
            {
                edgesToAdd.Add(new DiagramEdge
                {
                    FromNodeId = currentDiagramNodeId,
                    ToNodeId = nextDiagramNodeId,
                    Label = link.Evidence.DiagramLabel,
                    InferenceSource = link.Evidence.InferenceSource,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                });
            }

            currentDiagramNodeId = nextDiagramNodeId;
        }

        if (includeTerminalHopToTarget
            && !string.IsNullOrWhiteSpace(targetDiagramNodeId)
            && !string.Equals(currentDiagramNodeId, targetDiagramNodeId, StringComparison.Ordinal))
        {
            string edgeKey = BuildEdgeKey(currentDiagramNodeId, targetDiagramNodeId);

            if (addedEdgeKeys.Add(edgeKey))
            {
                InventoryDiagramDataFlowTraversalHopLink? terminalLink = path.OrderedLinks.LastOrDefault();

                edgesToAdd.Add(new DiagramEdge
                {
                    FromNodeId = currentDiagramNodeId,
                    ToNodeId = targetDiagramNodeId,
                    Label = terminalLink?.Evidence.DiagramLabel ?? "Routes to",
                    InferenceSource = terminalLink?.Evidence.InferenceSource,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                });
            }
        }
    }

    private static void ApplyHopEvidence(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode)
                || !InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopNode(graphNode))
            {
                continue;
            }

            string evidence = ResolveHopEvidenceLabel(graphNode, graph);

            if (!diagramNode.DataFlowTraversalHopEvidenceDetails.Contains(evidence, StringComparer.Ordinal))
            {
                diagramNode.DataFlowTraversalHopEvidenceDetails.Add(evidence);
            }
        }
    }

    private static string ResolveHopEvidenceLabel(GraphNode graphNode, GraphSnapshot graph)
    {
        List<string> evidenceLabels = [];

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.FromNodeId, graphNode.NodeId, StringComparison.Ordinal)
                && !string.Equals(edge.ToNodeId, graphNode.NodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (!InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(edge.EdgeType, edge.InferenceSource))
            {
                continue;
            }

            InventoryDiagramDataFlowTraversalHopEvidence? evidence = ResolveEdgeEvidence(edge);

            if (evidence is not null)
            {
                evidenceLabels.Add(evidence.DiagramLabel);
            }
        }

        if (evidenceLabels.Count > 0)
        {
            return string.Join(" · ", evidenceLabels.Distinct(StringComparer.OrdinalIgnoreCase));
        }

        return "Traversal hop";
    }

    private static InventoryDiagramDataFlowTraversalHopEvidence? ResolveEdgeEvidence(GraphEdge edge)
    {
        if (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edge.EdgeType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
            && fromType is not null
            && fromType.IncludeOnDataFlow)
        {
            return new InventoryDiagramDataFlowTraversalHopEvidence
            {
                AssociationType = fromType.AssociationType,
                InferenceSource = edge.InferenceSource,
                DiagramLabel = fromType.DiagramLabel,
            };
        }

        if (!InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(edge.EdgeType, edge.InferenceSource))
        {
            return null;
        }

        string associationType = edge.EdgeType ?? edge.InferenceSource ?? "traversal-hop";

        return new InventoryDiagramDataFlowTraversalHopEvidence
        {
            AssociationType = associationType,
            InferenceSource = edge.InferenceSource,
            DiagramLabel = associationType.Contains("firewall", StringComparison.OrdinalIgnoreCase)
                || associationType.Contains("route", StringComparison.OrdinalIgnoreCase)
                ? "Routes through"
                : "Routes to",
        };
    }

    private static DiagramNode? FindDiagramNodeForGraphNodeId(
        DiagramAst ast,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        string graphNodeId)
    {
        if (!graphToDiagramNodeId.TryGetValue(graphNodeId, out string? diagramNodeId))
        {
            return null;
        }

        return ast.Nodes.FirstOrDefault(node => string.Equals(node.NodeId, diagramNodeId, StringComparison.Ordinal));
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId)
    {
        return $"{fromNodeId}|{toNodeId}";
    }
}
