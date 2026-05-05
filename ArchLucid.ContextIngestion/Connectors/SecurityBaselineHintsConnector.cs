using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class SecurityBaselineHintsConnector(
    IConnectorInput<SecurityBaselineHintsPayload> payloadInput,
    IConnectorNormalizer<SecurityBaselineHintsPayload> payloadNormalizer) : IContextConnector
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
        _ = current;
        _ = ct;

        return Task.FromResult(new ContextDelta
        {
            Summary = previous is null
                ? "Initial security baseline hint ingestion"
                : "Updated security baseline hint ingestion"
        });
    }
}
