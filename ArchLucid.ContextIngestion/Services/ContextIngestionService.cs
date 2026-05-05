using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Services;

/// <summary>
///     Orchestrates context ingestion: delegates connector stages to <see cref="IConnectorPipelineOrchestrator" />
///     (parallel fetch+normalize, sequential delta segments), then canonicalizes and deduplicates the snapshot.
/// </summary>
public class ContextIngestionService(
    IConnectorPipelineOrchestrator connectorPipelineOrchestrator,
    ICanonicalEnricher enricher,
    ICanonicalDeduplicator deduplicator,
    IContextSnapshotRepository snapshotRepository) : IContextIngestionService
{
    public async Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.RunId == Guid.Empty)
            throw new ArgumentException("RunId must be a non-empty GUID.", nameof(request));
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ProjectId, nameof(request));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = request.RunId,
            ProjectId = request.ProjectId,
            CreatedUtc = DateTime.UtcNow
        };

        ContextSnapshot? previous = await snapshotRepository.GetLatestAsync(request.ProjectId, ct).ConfigureAwait(false);

        ConnectorPipelineStagesOutcome stages =
            await connectorPipelineOrchestrator.RunStagesAsync(request, previous, ct).ConfigureAwait(false);

        snapshot.Warnings.AddRange(stages.Warnings);

        IReadOnlyList<CanonicalObject> enriched = enricher.Enrich(stages.CanonicalObjects);
        snapshot.CanonicalObjects = deduplicator.Deduplicate(enriched).ToList();
        snapshot.DeltaSummary = stages.DeltaSummary;

        return snapshot;
    }
}
