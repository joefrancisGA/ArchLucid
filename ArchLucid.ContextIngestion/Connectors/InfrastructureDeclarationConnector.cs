using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

public sealed class InfrastructureDeclarationConnector(
    IConnectorInput<InfrastructureDeclarationsPayload> payloadInput,
    IConnectorNormalizer<InfrastructureDeclarationsPayload> payloadNormalizer) : IContextConnector
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
        _ = ct;

        int currentCount = current.CanonicalObjects.Count;

        if (previous is null)
            return Task.FromResult(new ContextDelta
            {
                Summary = $"Initial infrastructure declaration ingestion: {currentCount} object(s)."
            });

        int previousCount = previous.CanonicalObjects.Count;
        int diff = currentCount - previousCount;

        string summary = diff == 0
            ? $"Infrastructure declaration ingestion: {currentCount} object(s), no count change."
            : $"Infrastructure declaration ingestion: {currentCount} object(s) (\u0394{diff:+#;-#;0} from prior snapshot).";

        return Task.FromResult(new ContextDelta { Summary = summary });
    }
}
