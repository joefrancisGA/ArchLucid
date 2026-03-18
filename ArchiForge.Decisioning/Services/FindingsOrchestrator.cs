using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.KnowledgeGraph.Models;

namespace ArchiForge.Decisioning.Services;

public class FindingsOrchestrator : IFindingsOrchestrator
{
    private readonly IEnumerable<IFindingEngine> _engines;
    private readonly IFindingsSnapshotRepository _repository;

    public FindingsOrchestrator(
        IEnumerable<IFindingEngine> engines,
        IFindingsSnapshotRepository repository)
    {
        _engines = engines;
        _repository = repository;
    }

    public async Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct)
    {
        var allFindings = new List<Finding>();

        foreach (var engine in _engines)
        {
            var findings = await engine.AnalyzeAsync(graphSnapshot, ct);
            allFindings.AddRange(findings);
        }

        var snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshot.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings = allFindings
        };

        await _repository.SaveAsync(snapshot, ct);

        return snapshot;
    }
}

