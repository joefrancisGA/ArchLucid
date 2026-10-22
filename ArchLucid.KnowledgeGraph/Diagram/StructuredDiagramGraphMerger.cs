using System.Globalization;

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
        Dictionary<string, GraphEdge> edgesByDirectedPair = new(StringComparer.OrdinalIgnoreCase);
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

                    CoalesceDiagramNodeMetadata(existing, node);

                    continue;
                }

                nodesById[node.NodeId] = node;
            }

            foreach (GraphEdge edge in compileResult.Snapshot.Edges)
            {
                string directedPairKey = $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}";

                if (edgesByDirectedPair.TryGetValue(directedPairKey, out GraphEdge? existingEdge))
                {
                    if (!string.IsNullOrWhiteSpace(edge.EdgeId))
                    {
                        existingEdge.EdgeId = edge.EdgeId;
                    }

                    if (!string.IsNullOrWhiteSpace(edge.Label))
                    {
                        existingEdge.Label = edge.Label;
                    }

                    existingEdge.Weight = Math.Max(existingEdge.Weight, edge.Weight);

                    CoalesceDiagramEdgeMetadata(existingEdge, edge);

                    continue;
                }

                edgesByDirectedPair[directedPairKey] = edge;
            }
        }

        return new StructuredDiagramGraphMergeResult
        {
            Nodes = nodesById.Values.ToList(),
            Edges = edgesByDirectedPair.Values.ToList(),
            Warnings = warnings,
            CanonicalBindings = bindings,
        };
    }

    private static void CoalesceDiagramNodeMetadata(GraphNode existing, GraphNode incoming)
    {
        double existingConfidence = ReadInferenceConfidence(existing.Properties);
        double incomingConfidence = ReadInferenceConfidence(incoming.Properties);

        if (incoming.Properties.Count > 0)
        {
            foreach (KeyValuePair<string, string> property in incoming.Properties)
            {
                if (ShouldSkipPropertyOnWeakerIncomingCompile(
                        property.Key,
                        existingConfidence,
                        incomingConfidence))
                {
                    continue;
                }

                existing.Properties[property.Key] = property.Value;
            }
        }

        WriteInferenceConfidence(existing.Properties, Math.Max(existingConfidence, incomingConfidence));

        if (!string.IsNullOrWhiteSpace(incoming.ReasoningTrace)
            && incomingConfidence >= existingConfidence)
        {
            existing.ReasoningTrace = incoming.ReasoningTrace;
        }
    }

    private static void CoalesceDiagramEdgeMetadata(GraphEdge existing, GraphEdge incoming)
    {
        double existingConfidence = ReadInferenceConfidence(existing.Properties);
        double incomingConfidence = ReadInferenceConfidence(incoming.Properties);

        if (incoming.Properties.Count > 0)
        {
            foreach (KeyValuePair<string, string> property in incoming.Properties)
            {
                if (ShouldSkipPropertyOnWeakerIncomingCompile(
                        property.Key,
                        existingConfidence,
                        incomingConfidence))
                {
                    continue;
                }

                existing.Properties[property.Key] = property.Value;
            }
        }

        WriteInferenceConfidence(existing.Properties, Math.Max(existingConfidence, incomingConfidence));

        if (!string.IsNullOrWhiteSpace(incoming.ReasoningTrace)
            && incomingConfidence >= existingConfidence)
        {
            existing.ReasoningTrace = incoming.ReasoningTrace;
        }
    }

    private static bool ShouldSkipPropertyOnWeakerIncomingCompile(
        string propertyKey,
        double existingConfidence,
        double incomingConfidence)
    {
        if (incomingConfidence >= existingConfidence)
        {
            return false;
        }

        if (string.Equals(
                propertyKey,
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                StringComparison.Ordinal))
        {
            return true;
        }

        return string.Equals(propertyKey, StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, StringComparison.Ordinal)
            || string.Equals(propertyKey, StructuredDiagramGraphPropertyKeys.DiagramCitationRef, StringComparison.Ordinal);
    }

    private static double ReadInferenceConfidence(IReadOnlyDictionary<string, string> properties)
    {
        if (!properties.TryGetValue(StructuredDiagramGraphPropertyKeys.InferenceConfidence, out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return 0d;
        }

        return double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double confidence)
            ? confidence
            : 0d;
    }

    private static void WriteInferenceConfidence(IDictionary<string, string> properties, double confidence)
    {
        properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence] =
            confidence.ToString("0.###", CultureInfo.InvariantCulture);
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
