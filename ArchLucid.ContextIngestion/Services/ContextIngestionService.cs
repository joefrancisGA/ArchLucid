using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Topology;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Persistence.Context;
using System.Text.Json;

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
    private static readonly JsonSerializerOptions ActorJsonDeserializeOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };
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
                string.Join('|', request.RequiredCapabilities
                    .Where(static c => !string.IsNullOrWhiteSpace(c))
                    .Select(static c => c.Trim().ToLowerInvariant())
                    .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase));
        }

        if (request.TopologyHints is { Count: > 0 })
        {
            snapshot.SourceHashes[ContextScopeMetadataKeys.TopologyHints] =
                string.Join('|', request.TopologyHints
                    .Where(static h => !string.IsNullOrWhiteSpace(h))
                    .Select(static h =>
                        TopologyHintStableObjectIds.CanonicalizeHintName(h.Trim()).ToLowerInvariant())
                    .OrderBy(static h => h, StringComparer.OrdinalIgnoreCase));
        }

        if (request.Constraints is { Count: > 0 })
        {
            snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] =
                string.Join('|', request.Constraints
                    .Where(static c => !string.IsNullOrWhiteSpace(c))
                    .Select(static c => c.Trim().ToLowerInvariant())
                    .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase));
        }

        List<string> confirmedAssumptions = request.Assumptions
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static a => a.Trim().ToLowerInvariant())
            .OrderBy(static a => a, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (confirmedAssumptions.Count > 0)
            snapshot.SourceHashes[ContextScopeMetadataKeys.Assumptions] = string.Join('|', confirmedAssumptions);

        if (!string.IsNullOrWhiteSpace(request.ActorsJson))
            snapshot.SourceHashes[ContextScopeMetadataKeys.Actors] = CanonicalizeActorsJson(request.ActorsJson);

        if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(request.QualityAttribute))
            snapshot.SourceHashes[ContextScopeMetadataKeys.QualityAttribute] =
                request.QualityAttribute!.Trim().ToLowerInvariant();

        if (ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(request.FailureModeNote))
            snapshot.SourceHashes[ContextScopeMetadataKeys.FailureModeNote] =
                request.FailureModeNote!.Trim().ToLowerInvariant();

        if (previous is null)
            return;

        List<string> priorCategories = previous.CanonicalObjects
            .Where(static o => string.Equals(o.ObjectType, "TopologyResource", StringComparison.OrdinalIgnoreCase))
            .Select(static o =>
                o.Properties.TryGetValue("category", out string? category) && !string.IsNullOrWhiteSpace(category)
                    ? category.Trim().ToLowerInvariant()
                    : "general")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (priorCategories.Count > 0)
            snapshot.SourceHashes[ContextScopeMetadataKeys.PriorTopologyCategories] = string.Join('|', priorCategories);

        List<string> priorRequirementNames = previous.CanonicalObjects
            .Where(static o => string.Equals(o.ObjectType, "Requirement", StringComparison.OrdinalIgnoreCase))
            .Select(static o => o.Name.Trim().ToLowerInvariant())
            .Where(static name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (priorRequirementNames.Count == 0)
            return;

        snapshot.SourceHashes[ContextScopeMetadataKeys.PriorRequirementNames] = string.Join('|', priorRequirementNames);
    }

    private static string CanonicalizeActorsJson(string actorsJson)
    {
        try
        {
            List<ActorDescriptor>? actors = JsonSerializer.Deserialize<List<ActorDescriptor>>(
                actorsJson,
                ActorJsonDeserializeOptions);

            if (actors is not { Count: > 0 })
                return actorsJson.Trim();

            List<ActorDescriptor> orderedActors = actors
                .Select(static actor => new ActorDescriptor
                {
                    Label = string.IsNullOrWhiteSpace(actor.Label)
                        ? actor.Label
                        : actor.Label.Trim().ToLowerInvariant(),
                    Kind = actor.Kind,
                    TrustOrigin = actor.TrustOrigin,
                    Contract = actor.Contract,
                    Origin = actor.Origin,
                    Confidence = actor.Confidence,
                })
                .OrderBy(static actor => actor.Label ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(static actor => actor.Kind)
                .ThenBy(static actor => actor.TrustOrigin)
                .ThenBy(static actor => actor.Contract)
                .ThenBy(static actor => actor.Origin)
                .ThenBy(static actor => actor.Confidence)
                .ToList();

            return JsonSerializer.Serialize(orderedActors);
        }
        catch (JsonException)
        {
            return actorsJson.Trim();
        }
    }
}
