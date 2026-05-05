using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class DocumentConnectorPayloadExtractor : IConnectorInput<DocumentConnectorPayload>
{
    public DocumentConnectorPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new DocumentConnectorPayload { Documents = request.Documents.ToList() };
    }
}
