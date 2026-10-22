using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationEvidenceRecord
{
    public Guid EvidenceId
    {
        get;
        init;
    }

    public Guid InstanceId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public RemediationEvidencePhase Phase
    {
        get;
        init;
    }

    public string PayloadJson
    {
        get;
        init;
    } = string.Empty;

    public string ActorKey
    {
        get;
        init;
    } = string.Empty;

    public string CorrelationId
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
