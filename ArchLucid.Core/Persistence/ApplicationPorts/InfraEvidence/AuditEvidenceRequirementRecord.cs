using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceRequirementRecord
{
    public Guid RequirementId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public Guid FrameworkId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string EvidenceType
    {
        get;
        init;
    } = string.Empty;

    public string? RequiredAzureScopes
    {
        get;
        init;
    }

    public string? RequiredResourceTypes
    {
        get;
        init;
    }

    public string? CollectionMethod
    {
        get;
        init;
    }

    public string? Frequency
    {
        get;
        init;
    }

    public string? EvaluationMethod
    {
        get;
        init;
    }

    public bool ManualEvidenceAllowed
    {
        get;
        init;
    }

    public string? RequiredFreshness
    {
        get;
        init;
    }

    public AuditEvidenceAutomationClass AutomationClass
    {
        get;
        init;
    }
}
