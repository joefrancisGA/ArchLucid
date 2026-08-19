using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class SecurityBaselineHintsConnector(
    IConnectorInput<SecurityBaselineHintsPayload> payloadInput,
    IConnectorNormalizer<SecurityBaselineHintsPayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "security-baseline-hints";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        SecurityBaselineHintsPayload typed = payloadInput.Extract(request);

        return Task.FromResult(SecurityBaselineHintsRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        SecurityBaselineHintsPayload typed = SecurityBaselineHintsRawPayloadMapper.FromRaw(payload);

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
            sourceType: "SecurityBaselineHint",
            static o => o.SourceId,
            deltaComputer,
            ct);
    }
}
