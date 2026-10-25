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
        HashSet<string> warningKeys = new(StringComparer.OrdinalIgnoreCase);
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

            AddCompileWarnings(warnings, warningKeys, compileResult.Warnings);

            foreach (StructuredDiagramCanonicalBinding binding in compileResult.CanonicalBindings)
            {
                string bindingKey = BuildBindingDedupeKey(binding);

                if (!mergedBindingKeys.Add(bindingKey))
                {
                    continue;
                }

                bindings.Add(binding);
            }

            if (compileResult.Snapshot.Nodes.Count == 0 && compileResult.Snapshot.Edges.Count == 0)
            {
                continue;
            }

            foreach (GraphNode node in compileResult.Snapshot.Nodes)
            {
                string nodeKey = NormalizeNodeIdKey(node.NodeId);

                if (nodesById.TryGetValue(nodeKey, out GraphNode? existing))
                {
                    if (!string.IsNullOrWhiteSpace(node.Label))
                    {
                        existing.Label = node.Label.Trim();
                    }

                    if (!string.IsNullOrWhiteSpace(node.NodeType))
                    {
                        existing.NodeType = node.NodeType.Trim();
                    }

                    if (!string.IsNullOrWhiteSpace(node.Category))
                    {
                        existing.Category = node.Category.Trim();
                    }

                    CoalesceDiagramNodeMetadata(existing, node);

                    continue;
                }

                node.NodeId = nodeKey;
                nodesById[nodeKey] = node;
            }

            foreach (GraphEdge edge in compileResult.Snapshot.Edges)
            {
                string directedPairKey = BuildDirectedPairKey(edge);

                if (edgesByDirectedPair.TryGetValue(directedPairKey, out GraphEdge? existingEdge))
                {
                    if (!string.IsNullOrWhiteSpace(edge.EdgeId))
                    {
                        existingEdge.EdgeId = edge.EdgeId;
                    }

                    if (!string.IsNullOrWhiteSpace(edge.Label))
                    {
                        existingEdge.Label = edge.Label.Trim();
                    }

                    existingEdge.Weight = Math.Max(existingEdge.Weight, edge.Weight);

                    CoalesceDiagramEdgeMetadata(existingEdge, edge);

                    continue;
                }

                NormalizeEdgeEndpoints(edge);
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
                string propertyKey = NormalizeDiagramPropertyKey(property.Key);

                if (string.IsNullOrWhiteSpace(propertyKey))
                {
                    continue;
                }

                if (ShouldSkipPropertyOnWeakerIncomingCompile(
                        propertyKey,
                        existingConfidence,
                        incomingConfidence))
                {
                    continue;
                }

                existing.Properties[propertyKey] = NormalizeDiagramPropertyValue(property.Value);
            }
        }

        WriteInferenceConfidence(existing.Properties, Math.Max(existingConfidence, incomingConfidence));

        if (!string.IsNullOrWhiteSpace(incoming.ReasoningTrace)
            && incomingConfidence >= existingConfidence)
        {
            existing.ReasoningTrace = incoming.ReasoningTrace.Trim();
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
                string propertyKey = NormalizeDiagramPropertyKey(property.Key);

                if (string.IsNullOrWhiteSpace(propertyKey))
                {
                    continue;
                }

                if (ShouldSkipPropertyOnWeakerIncomingCompile(
                        propertyKey,
                        existingConfidence,
                        incomingConfidence))
                {
                    continue;
                }

                existing.Properties[propertyKey] = NormalizeDiagramPropertyValue(property.Value);
            }
        }

        WriteInferenceConfidence(existing.Properties, Math.Max(existingConfidence, incomingConfidence));

        if (!string.IsNullOrWhiteSpace(incoming.ReasoningTrace)
            && incomingConfidence >= existingConfidence)
        {
            existing.ReasoningTrace = incoming.ReasoningTrace.Trim();
        }
    }

    private static string NormalizeDiagramPropertyKey(string key) =>
        string.IsNullOrWhiteSpace(key) ? key : key.Trim();

    private static string NormalizeDiagramPropertyValue(string value) =>
        string.IsNullOrWhiteSpace(value) ? value : value.Trim();

    private static string BuildBindingDedupeKey(StructuredDiagramCanonicalBinding binding) =>
        $"{binding.CanonicalGraphNodeId.Trim()}|{binding.DiagramSourceId.Trim()}|{binding.DiagramGraphNodeId.Trim()}";

    private static string NormalizeNodeIdKey(string nodeId) => nodeId.Trim();

    private static void AddCompileWarnings(
        List<string> warnings,
        HashSet<string> warningKeys,
        IReadOnlyList<string> compileWarnings)
    {
        foreach (string warning in compileWarnings)
        {
            string normalized = NormalizeWarning(warning);

            if (normalized.Length == 0 || !warningKeys.Add(normalized))
            {
                continue;
            }

            warnings.Add(normalized);
        }
    }

    private static string NormalizeWarning(string? warning) => (warning ?? string.Empty).Trim();

    private static string BuildDirectedPairKey(GraphEdge edge) =>
        $"{edge.FromNodeId.Trim()}|{edge.ToNodeId.Trim()}|{(edge.EdgeType ?? string.Empty).Trim()}";

    private static void NormalizeEdgeEndpoints(GraphEdge edge)
    {
        edge.FromNodeId = edge.FromNodeId.Trim();
        edge.ToNodeId = edge.ToNodeId.Trim();
        edge.EdgeType = (edge.EdgeType ?? string.Empty).Trim();
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
        if (!GraphNodePropertyReader.TryGetPropertyValue(
                properties,
                StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                out string? raw))
        {
            return 0d;
        }

        return double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double confidence)
            ? confidence
            : 0d;
    }

    private static void WriteInferenceConfidence(IDictionary<string, string> properties, double confidence) =>
        StructuredDiagramGraphInferenceConfidenceWriter.Write(properties, confidence);
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
