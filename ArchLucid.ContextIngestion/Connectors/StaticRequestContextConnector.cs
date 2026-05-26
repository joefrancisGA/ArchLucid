using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class StaticRequestContextConnector(
    IConnectorInput<StaticRequestPayload> payloadInput,
    IConnectorNormalizer<StaticRequestPayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "static-request";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        StaticRequestPayload typed = payloadInput.Extract(request);

        return Task.FromResult(StaticRequestRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        StaticRequestPayload typed = StaticRequestRawPayloadMapper.FromRaw(payload);

        return payloadNormalizer.NormalizeAsync(typed, ct);
    }

    public Task<ContextDelta> DeltaAsync(
        NormalizedContextBatch current,
        ContextSnapshot? previous,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(current);

        return ConnectorDeltaAsyncHelper.ComputeAsync(
            current,
            previous,
            sourceType: "StaticRequest",
            static o => o.SourceId,
            deltaComputer,
            ct);
    }
}
