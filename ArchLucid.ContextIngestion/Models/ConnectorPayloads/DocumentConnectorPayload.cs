using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class DocumentConnectorPayload
{
    public IReadOnlyList<ContextDocumentReference> Documents
    {
        get;
        init;
    } = [];
}
