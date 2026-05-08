using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class TopologyHintsConnector(
    IConnectorInput<TopologyHintsPayload> payloadInput,
    IConnectorNormalizer<TopologyHintsPayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "topology-hints";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        TopologyHintsPayload typed = payloadInput.Extract(request);

        return Task.FromResult(TopologyHintsRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        TopologyHintsPayload typed = TopologyHintsRawPayloadMapper.FromRaw(payload);

        return payloadNormalizer.NormalizeAsync(typed, ct);
    }

    public Task<ContextDelta> DeltaAsync(
        NormalizedContextBatch current,
        ContextSnapshot? previous,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(current);

        // Filter the previous snapshot to only this connector's objects (SourceType = "TopologyHint").
        // All topology hints share SourceId = "topology-hint", so we use ObjectId as the stable key —
        // TopologyHintsPayloadNormalizer derives ObjectId deterministically via TopologyHintStableObjectIds.
        IReadOnlyList<CanonicalObject> previousSlice = previous?.CanonicalObjects
            .Where(static o => o.SourceType == "TopologyHint")
            .ToList() ?? [];

        return Task.FromResult(deltaComputer.Compute(
            current.CanonicalObjects,
            previousSlice,
            static o => o.ObjectId));
    }
}
