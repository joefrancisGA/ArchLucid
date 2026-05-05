using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class DocumentConnectorPayload
{
    public IReadOnlyList<ContextDocumentReference> Documents
    {
        get;
        init;
    } = [];
}
