using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class InlineRequirementsConnector(
    IConnectorInput<InlineRequirementsPayload> payloadInput,
    IConnectorNormalizer<InlineRequirementsPayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "inline-requirements";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        InlineRequirementsPayload typed = payloadInput.Extract(request);

        return Task.FromResult(InlineRequirementsRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        InlineRequirementsPayload typed = InlineRequirementsRawPayloadMapper.FromRaw(payload);

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
            sourceType: "InlineRequirement",
            static o => o.SourceId,
            deltaComputer,
            ct);
    }
}
