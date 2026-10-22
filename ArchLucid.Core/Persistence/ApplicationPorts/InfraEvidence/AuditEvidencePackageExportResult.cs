namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidencePackageExportResult
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

    public byte[]? ZipContent
    {
        get;
        init;
    }

    public string? PackageFileName
    {
        get;
        init;
    }

    public string? EvidenceHashesJson
    {
        get;
        init;
    }
}
