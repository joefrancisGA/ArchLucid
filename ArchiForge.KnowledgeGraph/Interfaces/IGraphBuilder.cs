using ArchiForge.ContextIngestion.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.KnowledgeGraph.Interfaces;

public interface IGraphBuilder
{
    Task<GraphBuildResult> BuildAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct);
}

