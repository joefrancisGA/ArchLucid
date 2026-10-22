namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathInsertResult
{
    public Guid PathId
    {
        get;
        init;
    }

    public bool Created
    {
        get;
        init;
    }
}
