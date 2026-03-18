using ArchiForge.ContextIngestion.Models;
using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.KnowledgeGraph.Services;

public class KnowledgeGraphService : IKnowledgeGraphService
{
    private readonly IGraphBuilder _graphBuilder;
    private readonly IGraphSnapshotRepository _repository;

    public KnowledgeGraphService(
        IGraphBuilder graphBuilder,
        IGraphSnapshotRepository repository)
    {
        _graphBuilder = graphBuilder;
        _repository = repository;
    }

    public async Task<GraphSnapshot> BuildSnapshotAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        var buildResult = await _graphBuilder.BuildAsync(contextSnapshot, ct);

        var snapshot = new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = contextSnapshot.SnapshotId,
            RunId = contextSnapshot.RunId,
            CreatedUtc = DateTime.UtcNow,
            Nodes = buildResult.Nodes,
            Edges = buildResult.Edges,
            Warnings = buildResult.Warnings
        };

        await _repository.SaveAsync(snapshot, ct);

        return snapshot;
    }
}

