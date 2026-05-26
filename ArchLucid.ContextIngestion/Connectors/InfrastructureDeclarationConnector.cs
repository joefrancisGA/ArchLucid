using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class InfrastructureDeclarationConnector(
    IConnectorInput<InfrastructureDeclarationsPayload> payloadInput,
    IConnectorNormalizer<InfrastructureDeclarationsPayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "infrastructure-declarations";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        InfrastructureDeclarationsPayload typed = payloadInput.Extract(request);

        return Task.FromResult(InfrastructureDeclarationsRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        InfrastructureDeclarationsPayload typed = InfrastructureDeclarationsRawPayloadMapper.FromRaw(payload);

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
            sourceType: "InfrastructureDeclaration",
            static o => o.SourceId,
            deltaComputer,
            ct);
    }
}
