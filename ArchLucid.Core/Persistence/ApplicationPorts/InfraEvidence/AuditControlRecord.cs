namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditControlRecord
{
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

    public string ControlNumber
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string? Objective
    {
        get;
        init;
    }

    public string? Applicability
    {
        get;
        init;
    }

    public string? ControlType
    {
        get;
        init;
    }

    public Guid? ParentControlId
    {
        get;
        init;
    }

    public string? EvaluationGuidance
    {
        get;
        init;
    }
}
