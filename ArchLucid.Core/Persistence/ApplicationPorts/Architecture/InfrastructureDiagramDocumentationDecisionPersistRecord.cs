namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class InfrastructureDiagramDocumentationDecisionPersistRecord
{
    public Guid DecisionId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid ScopeId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string SubjectKind
    {
        get;
        init;
    } = string.Empty;

    public string SubjectKey
    {
        get;
        init;
    } = string.Empty;

    public string Decision
    {
        get;
        init;
    } = string.Empty;

    public string? DiagramFingerprint
    {
        get;
        init;
    }

    public string EvidenceFingerprint
    {
        get;
        init;
    } = string.Empty;

    public string? SavedByUserOid
    {
        get;
        init;
    }

    public DateTime CreatedUtc
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
