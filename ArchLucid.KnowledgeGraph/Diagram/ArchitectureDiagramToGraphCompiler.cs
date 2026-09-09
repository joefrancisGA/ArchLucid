using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Compiles <see cref="ArchitectureDiagramModelRecord" /> into a <see cref="GraphSnapshot" /> with honest structured-parse provenance (AS-006).
/// </summary>
public sealed class ArchitectureDiagramToGraphCompiler : IArchitectureDiagramToGraphCompiler
{
    public StructuredDiagramGraphCompileResult Compile(
        ArchitectureDiagramModelRecord model,
        StructuredDiagramGraphCompileOptions options)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(options);

        if (!ArchitectureDiagramModelValidator.TryValidate(model, out string? validationFailure))
        {
            return new StructuredDiagramGraphCompileResult
            {
                Warnings = [validationFailure ?? "Structured diagram model validation failed."],
            };
        }

        GraphSnapshot snapshot = new()
        {
            SchemaVersion = 1,
            GraphSnapshotId = options.GraphSnapshotId,
            ContextSnapshotId = options.ContextSnapshotId,
            RunId = options.RunId,
            CreatedUtc = options.CreatedUtc,
        };

        Dictionary<string, string> nodeIdMap = new(StringComparer.Ordinal);
        Dictionary<string, SubgraphCompileContext> subgraphContexts = BuildSubgraphContexts(model.Subgraphs);

        foreach (ArchitectureDiagramSubgraphRecord subgraph in model.Subgraphs.OrderBy(subgraph => subgraph.OrderKey))
        {
            string subgraphId = subgraph.Id.Trim();

            if (!subgraphContexts.TryGetValue(subgraphId, out SubgraphCompileContext? context)
                || !context.IsTrustBoundaryHint)
            {
                continue;
            }

            string graphNodeId = BuildSubgraphNodeId(subgraphId);
            nodeIdMap[subgraphId] = graphNodeId;

            snapshot.Nodes.Add(new GraphNode
            {
                NodeId = graphNodeId,
                NodeType = GraphNodeTypes.TrustBoundary,
                Label = context.Label,
                SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagramSubgraph,
                SourceId = subgraphId,
                Properties = BuildTrustBoundarySubgraphProperties(model, subgraph, context.Label),
            });
        }

        int trustBoundaryIndex = 0;

        foreach (string trustBoundaryLabel in model.TrustBoundaryLabels)
        {
            if (string.IsNullOrWhiteSpace(trustBoundaryLabel))
            {
                continue;
            }

            string graphNodeId = $"diagram-trust-boundary:{trustBoundaryIndex++}";

            snapshot.Nodes.Add(new GraphNode
            {
                NodeId = graphNodeId,
                NodeType = GraphNodeTypes.TrustBoundary,
                Label = trustBoundaryLabel.Trim(),
                SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagramTrustBoundary,
                SourceId = graphNodeId,
                Properties = BuildTrustBoundaryProperties(model),
            });
        }

        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            if (node.Removed)
            {
                continue;
            }

            string graphNodeId = $"diagram-node:{node.Id.Trim()}";
            nodeIdMap[node.Id.Trim()] = graphNodeId;
            double confidence = ResolveNodeInferenceConfidence(node, options.LabelOnlyInferenceConfidence);

            snapshot.Nodes.Add(new GraphNode
            {
                NodeId = graphNodeId,
                NodeType = MapDiagramNodeKindToGraphNodeType(node.Kind),
                Label = string.IsNullOrWhiteSpace(node.Label) ? node.Id.Trim() : node.Label.Trim(),
                SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
                SourceId = node.Id.Trim(),
                Properties = BuildNodeProperties(model, node, confidence, subgraphContexts),
                ReasoningTrace = BuildNodeReasoningTrace(node, confidence),
            });
        }

        foreach (ArchitectureDiagramSubgraphRecord subgraph in model.Subgraphs)
        {
            if (!nodeIdMap.TryGetValue(subgraph.Id.Trim(), out string? subgraphNodeId))
            {
                continue;
            }

            foreach (ArchitectureDiagramNodeRecord node in model.Nodes.Where(
                         candidate => !candidate.Removed
                                      && string.Equals(candidate.SubgraphId?.Trim(), subgraph.Id.Trim(), StringComparison.Ordinal)))
            {
                if (!nodeIdMap.TryGetValue(node.Id.Trim(), out string? memberNodeId))
                {
                    continue;
                }

                snapshot.Edges.Add(BuildContainsEdge(
                    subgraphNodeId,
                    memberNodeId,
                    ClampLabelOnlyConfidence(options.LabelOnlyInferenceConfidence)));
            }
        }

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            if (edge.Removed)
            {
                continue;
            }

            if (!nodeIdMap.TryGetValue(edge.SourceId.Trim(), out string? fromNodeId)
                || !nodeIdMap.TryGetValue(edge.TargetId.Trim(), out string? toNodeId))
            {
                continue;
            }

            double confidence = ResolveEdgeInferenceConfidence(edge, options.LabelOnlyInferenceConfidence);

            snapshot.Edges.Add(new GraphEdge
            {
                EdgeId = $"diagram-edge:{edge.Id.Trim()}",
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = GraphEdgeTypes.ConnectsTo,
                Label = string.IsNullOrWhiteSpace(edge.Label) ? null : edge.Label.Trim(),
                Weight = confidence,
                InferenceSource = GraphEdgeInferenceSources.StructuredParse,
                ReasoningTrace = BuildEdgeReasoningTrace(edge, confidence),
                Properties = BuildEdgeProperties(model, edge, confidence),
            });
        }

        return new StructuredDiagramGraphCompileResult { Snapshot = snapshot };
    }

    private static string BuildSubgraphNodeId(string subgraphId)
    {
        return $"diagram-subgraph:{subgraphId.Trim()}";
    }

    private static string MapDiagramNodeKindToGraphNodeType(string kind)
    {
        if (string.Equals(kind, ArchitectureDiagramNodeKinds.User, StringComparison.OrdinalIgnoreCase))
        {
            return GraphNodeTypes.Actor;
        }

        if (string.Equals(kind, ArchitectureDiagramNodeKinds.Boundary, StringComparison.OrdinalIgnoreCase))
        {
            return GraphNodeTypes.TrustBoundary;
        }

        return GraphNodeTypes.TopologyResource;
    }

    private static double ResolveNodeInferenceConfidence(
        ArchitectureDiagramNodeRecord node,
        double labelOnlyInferenceConfidence)
    {
        if (string.Equals(node.Provenance, ArchitectureDiagramProvenanceKinds.Asserted, StringComparison.Ordinal))
        {
            return 1d;
        }

        return ClampLabelOnlyConfidence(labelOnlyInferenceConfidence);
    }

    private static double ResolveEdgeInferenceConfidence(
        ArchitectureDiagramEdgeRecord edge,
        double labelOnlyInferenceConfidence)
    {
        if (string.Equals(edge.Provenance, ArchitectureDiagramProvenanceKinds.Asserted, StringComparison.Ordinal))
        {
            return 1d;
        }

        return ClampLabelOnlyConfidence(labelOnlyInferenceConfidence);
    }

    private static double ClampLabelOnlyConfidence(double labelOnlyInferenceConfidence)
    {
        if (labelOnlyInferenceConfidence >= 1d)
        {
            return StructuredDiagramLabelOnlyInferenceDefaults.StandardConfidence;
        }

        return Math.Min(
            labelOnlyInferenceConfidence,
            StructuredDiagramLabelOnlyInferenceDefaults.MaxLabelOnlyConfidence);
    }

    private static Dictionary<string, string> BuildNodeProperties(
        ArchitectureDiagramModelRecord model,
        ArchitectureDiagramNodeRecord node,
        double confidence,
        IReadOnlyDictionary<string, SubgraphCompileContext> subgraphContexts)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = model.ExtractionMethod,
            [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = ResolveNodeProvenanceKind(node),
            [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = confidence.ToString("0.###"),
            [StructuredDiagramGraphPropertyKeys.DiagramNodeKind] = node.Kind,
        };

        if (!string.IsNullOrWhiteSpace(node.SubgraphId)
            && subgraphContexts.TryGetValue(node.SubgraphId.Trim(), out SubgraphCompileContext? subgraphContext))
        {
            properties[StructuredDiagramGraphPropertyKeys.DiagramSubgraphId] = subgraphContext.Id;
            properties[StructuredDiagramGraphPropertyKeys.DiagramSubgraphLabel] = subgraphContext.Label;

            if (subgraphContext.IsTrustBoundaryHint)
            {
                properties[StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel] = subgraphContext.Label;
            }
        }

        if (!string.IsNullOrWhiteSpace(model.SourceEvidenceItemId))
        {
            properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = model.SourceEvidenceItemId.Trim();
        }

        return properties;
    }

    private static Dictionary<string, string> BuildEdgeProperties(
        ArchitectureDiagramModelRecord model,
        ArchitectureDiagramEdgeRecord edge,
        double confidence)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = model.ExtractionMethod,
            [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = ResolveEdgeProvenanceKind(edge),
            [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = confidence.ToString("0.###"),
        };

        if (!string.IsNullOrWhiteSpace(model.SourceEvidenceItemId))
        {
            properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = model.SourceEvidenceItemId.Trim();
        }

        return properties;
    }

    private static Dictionary<string, string> BuildTrustBoundarySubgraphProperties(
        ArchitectureDiagramModelRecord model,
        ArchitectureDiagramSubgraphRecord subgraph,
        string resolvedLabel)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = model.ExtractionMethod,
            [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
            [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1",
            [StructuredDiagramGraphPropertyKeys.DiagramSubgraphId] = subgraph.Id.Trim(),
            [StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel] = resolvedLabel,
            ["trustOrigin"] = nameof(TrustOrigin.Internal),
        };

        if (!string.IsNullOrWhiteSpace(model.SourceEvidenceItemId))
        {
            properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = model.SourceEvidenceItemId.Trim();
        }

        return properties;
    }

    private static Dictionary<string, SubgraphCompileContext> BuildSubgraphContexts(
        IReadOnlyList<ArchitectureDiagramSubgraphRecord> subgraphs)
    {
        Dictionary<string, SubgraphCompileContext> contexts = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramSubgraphRecord subgraph in subgraphs)
        {
            string subgraphId = subgraph.Id.Trim();
            string label = StructuredDiagramTrustBoundaryClassifier.ResolveSubgraphLabel(subgraphId, subgraph.Label);

            contexts[subgraphId] = new SubgraphCompileContext
            {
                Id = subgraphId,
                Label = label,
                IsTrustBoundaryHint = StructuredDiagramTrustBoundaryClassifier.IsTrustBoundaryHint(label),
            };
        }

        return contexts;
    }

    private sealed class SubgraphCompileContext
    {
        public required string Id
        {
            get;
            init;
        }

        public required string Label
        {
            get;
            init;
        }

        public required bool IsTrustBoundaryHint
        {
            get;
            init;
        }
    }

    private static Dictionary<string, string> BuildTrustBoundaryProperties(ArchitectureDiagramModelRecord model)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [StructuredDiagramGraphPropertyKeys.ExtractionMethod] = model.ExtractionMethod,
            [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
            [StructuredDiagramGraphPropertyKeys.InferenceConfidence] = "1",
        };

        if (!string.IsNullOrWhiteSpace(model.SourceEvidenceItemId))
        {
            properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId] = model.SourceEvidenceItemId.Trim();
        }

        return properties;
    }

    private static GraphEdge BuildContainsEdge(
        string fromNodeId,
        string toNodeId,
        double labelOnlyInferenceConfidence)
    {
        return new GraphEdge
        {
            EdgeId = $"diagram-contains:{fromNodeId}->{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.Contains,
            Weight = labelOnlyInferenceConfidence,
            InferenceSource = GraphEdgeInferenceSources.StructuredParse,
            ReasoningTrace = "Structured diagram subgraph membership (deterministic inference; not inventory ObservedFact).",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
            },
        };
    }

    private static string ResolveNodeProvenanceKind(ArchitectureDiagramNodeRecord node)
    {
        // AS-017: label-only hints are never inventory ObservedFact; binding is AS-018.
        return StructuredDiagramGraphProvenanceKinds.DeterministicInference;
    }

    private static string ResolveEdgeProvenanceKind(ArchitectureDiagramEdgeRecord edge)
    {
        return StructuredDiagramGraphProvenanceKinds.DeterministicInference;
    }

    private static string BuildNodeReasoningTrace(ArchitectureDiagramNodeRecord node, double confidence)
    {
        return confidence < 1d
            ? $"Structured diagram node '{node.Id}' compiled from label-only hints (deterministic inference; not inventory ObservedFact)."
            : $"Structured diagram node '{node.Id}' compiled from asserted diagram source.";
    }

    private static string BuildEdgeReasoningTrace(ArchitectureDiagramEdgeRecord edge, double confidence)
    {
        return confidence < 1d
            ? $"Structured diagram edge '{edge.Id}' compiled from parsed topology (deterministic inference; not inventory ObservedFact)."
            : $"Structured diagram edge '{edge.Id}' compiled from asserted diagram source.";
    }
}
