using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class InlineRequirementsRawPayloadMapper
{
    public static RawContextPayload ToRaw(InlineRequirementsPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { InlineRequirements = typed.InlineRequirements.ToList() };
    }

    public static InlineRequirementsPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new InlineRequirementsPayload { InlineRequirements = raw.InlineRequirements.ToList() };
    }
}
