namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidencePackageEntry
{
    public string RelativePath
    {
        get;
        init;
    } = string.Empty;

    public byte[] Content
    {
        get;
        init;
    } = [];
}
