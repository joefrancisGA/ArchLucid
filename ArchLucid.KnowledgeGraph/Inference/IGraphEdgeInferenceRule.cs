using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference;

/// <summary>
///     One weight-family edge inference rule executed by <see cref="DefaultGraphEdgeInferer" />.
/// </summary>
public interface IGraphEdgeInferenceRule
{
    void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges);
}
