using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Rewrites compiled diagram topology to reuse canonical graph nodes instead of duplicate diagram nodes (AS-018).
/// </summary>
public static class StructuredDiagramCompiledGraphBinder
{
    public static StructuredDiagramGraphCompileResult BindToCanonicalNodes(
        StructuredDiagramGraphCompileResult compileResult,
        IReadOnlyList<GraphNode> bindTargets)
    {
        ArgumentNullException.ThrowIfNull(compileResult);
        ArgumentNullException.ThrowIfNull(bindTargets);

        if (compileResult.Snapshot.Nodes.Count == 0 || bindTargets.Count == 0)
        {
            return compileResult;
        }

        Dictionary<string, string> diagramNodeIdRemap = new(StringComparer.OrdinalIgnoreCase);
        List<StructuredDiagramCanonicalBinding> bindings = [];
        List<GraphNode> outputNodes = [];

        foreach (GraphNode diagramNode in compileResult.Snapshot.Nodes)
        {
            if (!IsDiagramTopologyNode(diagramNode))
            {
                outputNodes.Add(diagramNode);
                continue;
            }

            string diagramSourceId = string.IsNullOrWhiteSpace(diagramNode.SourceId)
                ? diagramNode.NodeId
                : diagramNode.SourceId.Trim();

            GraphNode? boundTarget = StructuredDiagramCanonicalBindMatcher.TryBindDiagramNode(
                diagramSourceId,
                diagramNode.Label,
                bindTargets);

            if (boundTarget is null)
            {
                outputNodes.Add(diagramNode);
                continue;
            }

            diagramNodeIdRemap[diagramNode.NodeId] = boundTarget.NodeId;
            bindings.Add(new StructuredDiagramCanonicalBinding
            {
                DiagramGraphNodeId = diagramNode.NodeId,
                DiagramSourceId = diagramSourceId,
                CanonicalGraphNodeId = boundTarget.NodeId,
            });
        }

        if (bindings.Count == 0)
        {
            return compileResult;
        }

        List<GraphEdge> remappedEdges = RemapEdges(compileResult.Snapshot.Edges, diagramNodeIdRemap);

        GraphSnapshot snapshot = new()
        {
            SchemaVersion = compileResult.Snapshot.SchemaVersion,
            GraphSnapshotId = compileResult.Snapshot.GraphSnapshotId,
            ContextSnapshotId = compileResult.Snapshot.ContextSnapshotId,
            RunId = compileResult.Snapshot.RunId,
            CreatedUtc = compileResult.Snapshot.CreatedUtc,
            Nodes = outputNodes,
            Edges = remappedEdges,
        };

        return new StructuredDiagramGraphCompileResult
        {
            Snapshot = snapshot,
            Warnings = compileResult.Warnings,
            CanonicalBindings = bindings,
        };
    }

    public static void ApplyBindingsToGraphNodes(
        IReadOnlyList<GraphNode> graphNodes,
        IReadOnlyList<StructuredDiagramCanonicalBinding> bindings)
    {
        ArgumentNullException.ThrowIfNull(graphNodes);
        ArgumentNullException.ThrowIfNull(bindings);

        if (bindings.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> nodeById = graphNodes.ToDictionary(
            node => node.NodeId,
            StringComparer.OrdinalIgnoreCase);

        foreach (StructuredDiagramCanonicalBinding binding in bindings)
        {
            if (!nodeById.TryGetValue(binding.CanonicalGraphNodeId, out GraphNode? target))
            {
                continue;
            }

            target.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId] = binding.DiagramSourceId;
            target.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramGraphNodeId] = binding.DiagramGraphNodeId;
            target.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                StructuredDiagramGraphProvenanceKinds.ObservedFact;
            target.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1";
        }
    }

    private static bool IsDiagramTopologyNode(GraphNode node)
    {
        return node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal);
    }

    private static List<GraphEdge> RemapEdges(
        IReadOnlyList<GraphEdge> edges,
        IReadOnlyDictionary<string, string> diagramNodeIdRemap)
    {
        List<GraphEdge> remapped = [];

        foreach (GraphEdge edge in edges)
        {
            string fromNodeId = RemapEndpoint(edge.FromNodeId, diagramNodeIdRemap);
            string toNodeId = RemapEndpoint(edge.ToNodeId, diagramNodeIdRemap);

            if (string.Equals(fromNodeId, toNodeId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            remapped.Add(new GraphEdge
            {
                EdgeId = edge.EdgeId,
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = edge.EdgeType,
                Label = edge.Label,
                Weight = edge.Weight,
                InferenceSource = edge.InferenceSource,
                ReasoningTrace = edge.ReasoningTrace,
                Properties = edge.Properties is null
                    ? []
                    : new Dictionary<string, string>(edge.Properties, StringComparer.Ordinal),
            });
        }

        return remapped;
    }

    private static string RemapEndpoint(string nodeId, IReadOnlyDictionary<string, string> diagramNodeIdRemap)
    {
        if (diagramNodeIdRemap.TryGetValue(nodeId, out string? remapped))
        {
            return remapped;
        }

        return nodeId;
    }
}
