using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditAssessmentRecord
{
    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public Guid FrameworkId
    {
        get;
        init;
    }

    public string FrameworkVersion
    {
        get;
        init;
    } = string.Empty;

    public string ScopeJson
    {
        get;
        init;
    } = "{}";

    public DateTime? PeriodStartUtc
    {
        get;
        init;
    }

    public DateTime? PeriodEndUtc
    {
        get;
        init;
    }

    public AuditAssessmentStatus Status
    {
        get;
        init;
    }

    public string RequestedBy
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
