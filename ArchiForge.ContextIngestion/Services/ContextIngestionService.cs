using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.ContextIngestion.Models;

namespace ArchiForge.ContextIngestion.Services;

public class ContextIngestionService : IContextIngestionService
{
    private readonly IEnumerable<IContextConnector> _connectors;
    private readonly IContextSnapshotRepository _repo;

    public ContextIngestionService(
        IEnumerable<IContextConnector> connectors,
        IContextSnapshotRepository repo)
    {
        _connectors = connectors;
        _repo = repo;
    }

    public async Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        var snapshot = new ContextSnapshot
        {
            SnapshotId = Guid.NewGuid(),
            RunId = request.RunId,
            CreatedUtc = DateTime.UtcNow
        };

        var previous = await _repo.GetLatestAsync(request.ProjectId, ct);

        foreach (var connector in _connectors)
        {
            var raw = await connector.FetchAsync(request, ct);
            var normalized = await connector.NormalizeAsync(raw, ct);
            var delta = await connector.DeltaAsync(normalized, previous, ct);

            snapshot.CanonicalObjects.AddRange(normalized.CanonicalObjects);
            snapshot.DeltaSummary = delta.Summary;
        }

        await _repo.SaveAsync(snapshot, ct);

        return snapshot;
    }
}

