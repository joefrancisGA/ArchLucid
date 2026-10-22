using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class StaticRequestRawPayloadMapper
{
    public static RawContextPayload ToRaw(StaticRequestPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { Description = typed.Description };
    }

    public static StaticRequestPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new StaticRequestPayload { Description = raw.Description };
    }
}
