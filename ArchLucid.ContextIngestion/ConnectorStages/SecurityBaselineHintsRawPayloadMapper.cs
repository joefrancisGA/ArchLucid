using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class SecurityBaselineHintsRawPayloadMapper
{
    public static RawContextPayload ToRaw(SecurityBaselineHintsPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { SecurityBaselineHints = typed.SecurityBaselineHints.ToList() };
    }

    public static SecurityBaselineHintsPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new SecurityBaselineHintsPayload { SecurityBaselineHints = raw.SecurityBaselineHints.ToList() };
    }
}
