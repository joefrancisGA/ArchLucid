using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Compiles structured diagram models into graph nodes/edges for authority pipeline merge (AS-016).
/// </summary>
public sealed class StructuredDiagramGraphMerger(IArchitectureDiagramToGraphCompiler compiler)
{
    private readonly IArchitectureDiagramToGraphCompiler compiler =
        compiler ?? throw new ArgumentNullException(nameof(compiler));

    public StructuredDiagramGraphMergeResult Merge(
        ContextSnapshot contextSnapshot,
        IReadOnlyList<GraphNode> bindTargets)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);
        ArgumentNullException.ThrowIfNull(bindTargets);

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(contextSnapshot.CanonicalObjects);

        if (documents.Count == 0)
        {
            return new StructuredDiagramGraphMergeResult();
        }

        Dictionary<string, GraphNode> nodesById = new(StringComparer.OrdinalIgnoreCase);
        List<GraphEdge> edges = [];
        HashSet<string> mergedDirectedPairs = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];
        List<StructuredDiagramCanonicalBinding> bindings = [];
        HashSet<string> mergedBindingKeys = new(StringComparer.OrdinalIgnoreCase);
        Guid graphSnapshotId = Guid.NewGuid();

        foreach (StructuredDiagramReconstructedDocument document in documents)
        {
            StructuredDiagramGraphCompileResult compileResult = this.compiler.Compile(
                document.Model,
                new StructuredDiagramGraphCompileOptions
                {
                    RunId = contextSnapshot.RunId,
                    ContextSnapshotId = contextSnapshot.SnapshotId,
                    GraphSnapshotId = graphSnapshotId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    LabelOnlyInferenceConfidence = document.LabelOnlyInferenceConfidence,
                });

            compileResult = StructuredDiagramCompiledGraphBinder.BindToCanonicalNodes(compileResult, bindTargets);

            if (compileResult.Warnings.Count > 0)
            {
                warnings.AddRange(compileResult.Warnings);
            }

            foreach (StructuredDiagramCanonicalBinding binding in compileResult.CanonicalBindings)
            {
                string bindingKey =
                    $"{binding.CanonicalGraphNodeId}|{binding.DiagramSourceId}|{binding.DiagramGraphNodeId}";

                if (!mergedBindingKeys.Add(bindingKey))
                {
                    continue;
                }

                bindings.Add(binding);
            }

            if (compileResult.Snapshot.Nodes.Count == 0)
            {
                continue;
            }

            foreach (GraphNode node in compileResult.Snapshot.Nodes)
            {
                if (nodesById.TryGetValue(node.NodeId, out GraphNode? existing))
                {
                    if (!string.IsNullOrWhiteSpace(node.Label))
                    {
                        existing.Label = node.Label;
                    }

                    if (!string.IsNullOrWhiteSpace(node.NodeType))
                    {
                        existing.NodeType = node.NodeType;
                    }

                    if (!string.IsNullOrWhiteSpace(node.Category))
                    {
                        existing.Category = node.Category;
                    }

                    continue;
                }

                nodesById[node.NodeId] = node;
            }

            foreach (GraphEdge edge in compileResult.Snapshot.Edges)
            {
                string directedPairKey = $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}";

                if (!mergedDirectedPairs.Add(directedPairKey))
                {
                    continue;
                }

                edges.Add(edge);
            }
        }

        return new StructuredDiagramGraphMergeResult
        {
            Nodes = nodesById.Values.ToList(),
            Edges = edges,
            Warnings = warnings,
            CanonicalBindings = bindings,
        };
    }
}

public sealed class StructuredDiagramGraphMergeResult
{
    public IReadOnlyList<GraphNode> Nodes
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GraphEdge> Edges
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<StructuredDiagramCanonicalBinding> CanonicalBindings
    {
        get;
        init;
    } = [];
}
