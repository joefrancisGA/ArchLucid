using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;

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
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        ContextSnapshot? previous = await snapshotRepository.GetLatestAsync(request.ProjectId, ct).ConfigureAwait(false);

        ConnectorPipelineStagesOutcome stages =
            await connectorPipelineOrchestrator.RunStagesAsync(request, previous, ct).ConfigureAwait(false);

        snapshot.Warnings.AddRange(stages.Warnings);

        IReadOnlyList<CanonicalObject> enriched = enricher.Enrich(stages.CanonicalObjects);
        snapshot.CanonicalObjects = deduplicator.Deduplicate(enriched).ToList();
        snapshot.DeltaSummary = stages.DeltaSummary;
        ApplyScopeMetadata(snapshot, request, previous);

        return snapshot;
    }

    private static void ApplyScopeMetadata(
        ContextSnapshot snapshot,
        ContextIngestionRequest request,
        ContextSnapshot? previous)
    {
        if (request.RequiredCapabilities is { Count: > 0 })
        {
            snapshot.SourceHashes[ContextScopeMetadataKeys.RequiredCapabilities] =
                string.Join('|', request.RequiredCapabilities.Where(static c => !string.IsNullOrWhiteSpace(c)));
        }

        if (request.TopologyHints is { Count: > 0 })
        {
            snapshot.SourceHashes[ContextScopeMetadataKeys.TopologyHints] =
                string.Join('|', request.TopologyHints.Where(static h => !string.IsNullOrWhiteSpace(h)));
        }

        if (request.Constraints is { Count: > 0 })
        {
            snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] =
                string.Join('|', request.Constraints.Where(static c => !string.IsNullOrWhiteSpace(c)));
        }

        if (previous is null)
            return;

        List<string> priorCategories = previous.CanonicalObjects
            .Where(static o => string.Equals(o.ObjectType, "TopologyResource", StringComparison.OrdinalIgnoreCase))
            .Select(static o =>
                o.Properties.TryGetValue("category", out string? category) && !string.IsNullOrWhiteSpace(category)
                    ? category
                    : "general")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (priorCategories.Count > 0)
            snapshot.SourceHashes[ContextScopeMetadataKeys.PriorTopologyCategories] = string.Join('|', priorCategories);

        List<string> priorRequirementNames = previous.CanonicalObjects
            .Where(static o => string.Equals(o.ObjectType, "Requirement", StringComparison.OrdinalIgnoreCase))
            .Select(static o => o.Name)
            .Where(static name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (priorRequirementNames.Count == 0)
            return;

        snapshot.SourceHashes[ContextScopeMetadataKeys.PriorRequirementNames] = string.Join('|', priorRequirementNames);
    }
}
