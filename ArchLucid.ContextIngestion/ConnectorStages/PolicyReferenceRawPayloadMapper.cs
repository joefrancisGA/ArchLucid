using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public static class PolicyReferenceRawPayloadMapper
{
    public static RawContextPayload ToRaw(PolicyReferencePayload typed)
    {
        ArgumentNullException.ThrowIfNull(typed);

        return new RawContextPayload
        {
            PolicyReferences = typed.PolicyReferences.ToList(), TopologyHints = typed.TopologyHints.ToList()
        };
    }

    public static PolicyReferencePayload FromRaw(RawContextPayload raw)
    {
        ArgumentNullException.ThrowIfNull(raw);

        return new PolicyReferencePayload
        {
            PolicyReferences = raw.PolicyReferences.ToList(), TopologyHints = raw.TopologyHints.ToList()
        };
    }
}
