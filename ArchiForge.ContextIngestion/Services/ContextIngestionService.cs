using ArchiForge.ContextIngestion.Canonicalization;
using ArchiForge.ContextIngestion.Interfaces;
using ArchiForge.ContextIngestion.Models;
using ArchiForge.ContextIngestion.Summaries;

namespace ArchiForge.ContextIngestion.Services;

public class ContextIngestionService : IContextIngestionService
{
    private readonly IEnumerable<IContextConnector> _connectors;
    private readonly ICanonicalDeduplicator _deduplicator;
    private readonly IContextSnapshotRepository _snapshotRepository;
    private readonly IContextDeltaSummaryBuilder _deltaSummaryBuilder;

    public ContextIngestionService(
        IEnumerable<IContextConnector> connectors,
        ICanonicalDeduplicator deduplicator,
        IContextSnapshotRepository snapshotRepository,
        IContextDeltaSummaryBuilder deltaSummaryBuilder)
    {
        _connectors = connectors;
        _deduplicator = deduplicator;
        _snapshotRepository = snapshotRepository;
        _deltaSummaryBuilder = deltaSummaryBuilder;
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

        // Latest persisted snapshot for this project (any prior run), used for connector delta messaging.
        var previous = await _snapshotRepository.GetLatestAsync(request.ProjectId, ct);

        var allObjects = new List<CanonicalObject>();
        var deltaSummaries = new List<string>();
        var connectorIndex = 0;

        foreach (var connector in _connectors)
        {
            var raw = await connector.FetchAsync(request, ct);
            var normalized = await connector.NormalizeAsync(raw, ct);
            var delta = await connector.DeltaAsync(normalized, previous, ct);

            allObjects.AddRange(normalized.CanonicalObjects);
            snapshot.Warnings.AddRange(normalized.Warnings);

            var segment = _deltaSummaryBuilder.BuildSegment(
                connector.ConnectorType,
                delta.Summary,
                normalized,
                previous,
                isFirstConnector: connectorIndex == 0);
            deltaSummaries.Add(segment);
            connectorIndex++;
        }

        snapshot.CanonicalObjects = _deduplicator.Deduplicate(allObjects).ToList();
        snapshot.DeltaSummary = string.Join("; ", deltaSummaries);

        return snapshot;
    }
}
