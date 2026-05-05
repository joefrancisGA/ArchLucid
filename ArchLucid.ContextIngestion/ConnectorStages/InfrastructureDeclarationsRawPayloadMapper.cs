using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class InfrastructureDeclarationsRawPayloadMapper
{
    public static RawContextPayload ToRaw(InfrastructureDeclarationsPayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload { InfrastructureDeclarations = typed.InfrastructureDeclarations.ToList() };
    }

    public static InfrastructureDeclarationsPayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new InfrastructureDeclarationsPayload
        {
            InfrastructureDeclarations = raw.InfrastructureDeclarations.ToList()
        };
    }
}
