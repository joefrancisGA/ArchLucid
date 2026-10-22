using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference;

/// <summary>
///     Shared node sets passed to individual graph edge inference rules.
/// </summary>
public sealed class GraphEdgeInferenceContext
{
    public required ContextSnapshot ContextSnapshot { get; init; }

    public required IReadOnlyList<GraphNode> Nodes { get; init; }

    public required string ContextNodeId { get; init; }

    public required IReadOnlyList<GraphNode> TopologyNodes { get; init; }

    public required IReadOnlyList<GraphNode> SecurityNodes { get; init; }

    public required IReadOnlyList<GraphNode> PolicyNodes { get; init; }

    public required IReadOnlyList<GraphNode> RequirementNodes { get; init; }

    public required Dictionary<string, GraphNode> NodeById { get; init; }
}
