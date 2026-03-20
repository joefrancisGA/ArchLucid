using ArchiForge.ContextIngestion.Canonicalization;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.ContextIngestion.Models;

namespace ArchiForge.ContextIngestion.Services;

public class ContextIngestionService : IContextIngestionService
{
    private readonly IEnumerable<IContextConnector> _connectors;
    private readonly ICanonicalDeduplicator _deduplicator;

    public ContextIngestionService(
        IEnumerable<IContextConnector> connectors,
        ICanonicalDeduplicator deduplicator)
    {
        _connectors = connectors;
        _deduplicator = deduplicator;
    }

    public async Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        var snapshot = new ContextSnapshot
        {
            SnapshotId = Guid.NewGuid(),
            RunId = request.RunId,
            ProjectId = request.ProjectId,
            CreatedUtc = DateTime.UtcNow
        };

        var allObjects = new List<CanonicalObject>();
        var deltaSummaries = new List<string>();

        foreach (var connector in _connectors)
        {
            var raw = await connector.FetchAsync(request, ct);
            var normalized = await connector.NormalizeAsync(raw, ct);
            var delta = await connector.DeltaAsync(normalized, null, ct);

            allObjects.AddRange(normalized.CanonicalObjects);

            if (!string.IsNullOrWhiteSpace(delta.Summary))
            {
                deltaSummaries.Add(delta.Summary);
            }
        }

        snapshot.CanonicalObjects = _deduplicator.Deduplicate(allObjects).ToList();
        snapshot.DeltaSummary = string.Join("; ", deltaSummaries);

        return snapshot;
    }
}
