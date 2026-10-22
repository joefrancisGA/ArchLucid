using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class TopologyHintsRawPayloadMapper
{
    public static RawContextPayload ToRaw(TopologyHintsPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { TopologyHints = typed.TopologyHints.ToList() };
    }

    public static TopologyHintsPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new TopologyHintsPayload { TopologyHints = raw.TopologyHints.ToList() };
    }
}
