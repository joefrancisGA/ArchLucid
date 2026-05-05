using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class TopologyHintsConnector(
    IConnectorInput<TopologyHintsPayload> payloadInput,
    IConnectorNormalizer<TopologyHintsPayload> payloadNormalizer) : IContextConnector
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
        _ = current;
        _ = ct;

        return Task.FromResult(new ContextDelta
        {
            Summary = previous is null ? "Initial topology hint ingestion" : "Updated topology hint ingestion"
        });
    }
}
