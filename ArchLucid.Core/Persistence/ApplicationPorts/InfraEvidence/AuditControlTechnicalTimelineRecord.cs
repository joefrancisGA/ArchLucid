using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditControlTechnicalTimelineRecord
{
    public Guid TimelineStateId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public AuditControlTechnicalTimelineState State
    {
        get;
        init;
    }

    public Guid? InventoryDiffId
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
