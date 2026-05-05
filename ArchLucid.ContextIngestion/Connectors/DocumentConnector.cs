using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.Connectors;

/// <summary>
///     Normalizes inline <see cref="ContextDocumentReference" /> items using the first
///     <see cref="Contracts.IContextDocumentParser" /> in
///     <see
///         cref="ArchLucid.ContextIngestion.Infrastructure.ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers" />
///     order where <see cref="Contracts.IContextDocumentParser.CanParse" /> returns true.
/// </summary>
public sealed class DocumentConnector(
    IConnectorInput<DocumentConnectorPayload> payloadInput,
    IConnectorNormalizer<DocumentConnectorPayload> payloadNormalizer) : IContextConnector
{
    public string ConnectorType => "documents";

    public Task<RawContextPayload> FetchAsync(
        ContextIngestionRequest request,
        CancellationToken ct)
    {
        _ = ct;
        ArgumentNullException.ThrowIfNull(request);

        DocumentConnectorPayload typed = payloadInput.Extract(request);

        return Task.FromResult(DocumentConnectorRawPayloadMapper.ToRaw(typed));
    }

    public Task<NormalizedContextBatch> NormalizeAsync(
        RawContextPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        DocumentConnectorPayload typed = DocumentConnectorRawPayloadMapper.FromRaw(payload);

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
            Summary = previous is null ? "Initial document ingestion" : "Updated document ingestion"
        });
    }
}
