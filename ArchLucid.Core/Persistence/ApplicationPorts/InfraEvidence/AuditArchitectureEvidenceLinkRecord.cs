namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Links sealed ArchLucid architecture evidence (golden manifest / ADR) to an audit requirement.</summary>
public sealed class AuditArchitectureEvidenceLinkRecord
{
    public Guid LinkId
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

    public Guid RequirementId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public Guid GoldenManifestId
    {
        get;
        init;
    }

    public string LinkedBy
    {
        get;
        init;
    } = string.Empty;

    public DateTime LinkedUtc
    {
        get;
        init;
    }
}
