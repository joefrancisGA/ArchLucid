using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Summaries;

namespace ArchLucid.ContextIngestion.Services;

/// <summary>
///     Parallel fetch+normalize per connector; sequential delta and <see cref="ContextSnapshot.DeltaSummary" /> segments
///     in <see cref="IConnectorDescriptor.PipelineOrder" /> (Task.WhenAll result index aligns with sorted descriptor index).
/// </summary>
public sealed class DefaultConnectorPipelineOrchestrator(
    IReadOnlyList<IConnectorDescriptor> descriptors,
    IContextDeltaSummaryBuilder deltaSummaryBuilder) : IConnectorPipelineOrchestrator
{
    private readonly IReadOnlyList<IConnectorDescriptor> _descriptors =
        descriptors ?? throw new ArgumentNullException(nameof(descriptors));

    private readonly IContextDeltaSummaryBuilder _deltaSummaryBuilder =
        deltaSummaryBuilder ?? throw new ArgumentNullException(nameof(deltaSummaryBuilder));

    public async Task<ConnectorPipelineStagesOutcome> RunStagesAsync(
        ContextIngestionRequest request,
        ContextSnapshot? previousSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (_descriptors.Count == 0)
            return new ConnectorPipelineStagesOutcome();

        IConnectorDescriptor[] ordered = _descriptors
            .OrderBy(d => d.PipelineOrder)
            .ThenBy(d => d.Connector.ConnectorType, StringComparer.Ordinal)
            .ToArray();

        Task<NormalizedContextBatch>[] fetchNormalizeTasks = new Task<NormalizedContextBatch>[ordered.Length];

        for (int i = 0; i < ordered.Length; i++)
        {
            IContextConnector connector = ordered[i].Connector;
            fetchNormalizeTasks[i] = FetchAndNormalizeAsync(connector, request, ct);
        }

        NormalizedContextBatch[] normalizedBatches = await Task.WhenAll(fetchNormalizeTasks).ConfigureAwait(false);

        ConnectorPipelineStagesOutcome outcome = new();
        List<string> deltaSegments = [];

        for (int i = 0; i < ordered.Length; i++)
        {
            IContextConnector connector = ordered[i].Connector;
            NormalizedContextBatch normalized = normalizedBatches[i];

            ContextDelta delta = await connector.DeltaAsync(normalized, previousSnapshot, ct).ConfigureAwait(false);

            outcome.CanonicalObjects.AddRange(normalized.CanonicalObjects);
            outcome.Warnings.AddRange(normalized.Warnings);

            string segment = _deltaSummaryBuilder.BuildSegment(
                connector.ConnectorType,
                delta.Summary,
                normalized,
                previousSnapshot,
                i == 0);
            deltaSegments.Add(segment);
        }

        outcome.DeltaSummary = string.Join("; ", deltaSegments);
        return outcome;
    }

    private static async Task<NormalizedContextBatch> FetchAndNormalizeAsync(
        IContextConnector connector,
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        RawContextPayload raw = await connector.FetchAsync(request, ct).ConfigureAwait(false);
        return await connector.NormalizeAsync(raw, ct).ConfigureAwait(false);
    }
}
