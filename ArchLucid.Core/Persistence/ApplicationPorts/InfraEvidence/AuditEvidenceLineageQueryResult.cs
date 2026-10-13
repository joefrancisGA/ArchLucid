namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceLineageQueryResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public AuditEvidenceLineageRecord? Lineage
    {
        get;
        init;
    }
}
