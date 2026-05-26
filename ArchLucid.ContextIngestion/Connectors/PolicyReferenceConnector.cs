using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class PolicyReferenceConnector(
    IConnectorInput<PolicyReferencePayload> payloadInput,
    IConnectorNormalizer<PolicyReferencePayload> payloadNormalizer,
    IConnectorDeltaComputer deltaComputer) : IContextConnector
{
    public string ConnectorType => "policy-reference";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        PolicyReferencePayload typed = payloadInput.Extract(request);

        return Task.FromResult(PolicyReferenceRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        PolicyReferencePayload typed = PolicyReferenceRawPayloadMapper.FromRaw(payload);

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
            sourceType: "PolicyReference",
            static o => o.SourceId,
            deltaComputer,
            ct);
    }
}
