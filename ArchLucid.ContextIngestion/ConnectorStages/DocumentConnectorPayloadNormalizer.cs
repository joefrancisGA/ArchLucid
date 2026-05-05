using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class DocumentConnectorPayloadNormalizer(IReadOnlyList<IContextDocumentParser> parsers)
    : IConnectorNormalizer<DocumentConnectorPayload>
{
    public async Task<NormalizedContextBatch> NormalizeAsync(
        DocumentConnectorPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);

        NormalizedContextBatch batch = new();

        foreach (ContextDocumentReference document in payload.Documents)
        {
            IContextDocumentParser? parser = parsers.FirstOrDefault(x => x.CanParse(document.ContentType));

            if (parser is null)
            {
                batch.Warnings.Add(
                    $"No registered context document parser accepted '{document.Name}' " +
                    $"(contentType='{document.ContentType}'). Document skipped. " +
                    "For HTTP requests, ContentType is validated at the API; if you still see this, " +
                    "align parser registrations (see ContextDocumentParserPipeline / SupportedContextDocumentContentTypes) " +
                    "or check non-API callers building ContextIngestionRequest.");
                continue;
            }

            IReadOnlyList<CanonicalObject> objects = await parser.ParseAsync(document, ct);
            batch.CanonicalObjects.AddRange(objects);
        }

        return batch;
    }
}
