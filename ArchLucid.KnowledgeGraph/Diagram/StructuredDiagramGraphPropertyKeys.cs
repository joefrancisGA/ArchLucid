namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Optional <see cref="ArchLucid.Contracts.Persistence.Graph.GraphNode.Properties" /> keys for structured diagram compile (AS-006).
/// </summary>
public static class StructuredDiagramGraphPropertyKeys
{
    public const string ExtractionMethod = "structuredDiagram.extractionMethod";

    public const string ProvenanceKind = "structuredDiagram.provenanceKind";

    public const string InferenceConfidence = "structuredDiagram.inferenceConfidence";

    public const string DiagramNodeKind = "structuredDiagram.nodeKind";

    public const string SourceEvidenceItemId = "structuredDiagram.sourceEvidenceItemId";

    public const string DiagramSubgraphId = "structuredDiagram.subgraphId";

    public const string DiagramSubgraphLabel = "structuredDiagram.subgraphLabel";

    public const string TrustBoundaryLabel = "structuredDiagram.trustBoundaryLabel";

    public const string BoundDiagramNodeId = "structuredDiagram.boundDiagramNodeId";

    public const string BoundDiagramGraphNodeId = "structuredDiagram.boundDiagramGraphNodeId";
}

/// <summary>
///     <see cref="ArchLucid.Contracts.Persistence.Graph.GraphNode.SourceType" /> for nodes compiled from structured diagrams.
/// </summary>
public static class StructuredDiagramGraphSourceTypes
{
    public const string StructuredDiagram = "structured-diagram";

    public const string StructuredDiagramSubgraph = "structured-diagram-subgraph";

    public const string StructuredDiagramTrustBoundary = "structured-diagram-trust-boundary";
}

/// <summary>
///     Provenance labels stored on compiled graph nodes — never Azure inventory ObservedFact (AS-006).
/// </summary>
public static class StructuredDiagramGraphProvenanceKinds
{
    public const string DeterministicInference = "DeterministicInference";

    /// <summary>Reserved for inventory-bound diagram nodes (AS-018); never used for label-only hints.</summary>
    public const string ObservedFact = "ObservedFact";
}
