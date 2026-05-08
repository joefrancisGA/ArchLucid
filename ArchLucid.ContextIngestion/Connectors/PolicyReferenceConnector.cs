using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

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
        _ = ct;
        ArgumentNullException.ThrowIfNull(current);

        // Filter the previous snapshot to only this connector's objects (SourceType = "PolicyReference").
        // Each PolicyControl has SourceId = the policy reference string, making it a stable per-object key.
        IReadOnlyList<CanonicalObject> previousSlice = previous?.CanonicalObjects
            .Where(static o => o.SourceType == "PolicyReference")
            .ToList() ?? [];

        return Task.FromResult(deltaComputer.Compute(
            current.CanonicalObjects,
            previousSlice,
            static o => o.SourceId));
    }
}
