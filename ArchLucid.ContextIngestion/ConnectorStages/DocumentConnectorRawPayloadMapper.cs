using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class DocumentConnectorRawPayloadMapper
{
    public static RawContextPayload ToRaw(DocumentConnectorPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { Documents = typed.Documents.ToList() };
    }

    public static DocumentConnectorPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new DocumentConnectorPayload { Documents = raw.Documents.ToList() };
    }
}
