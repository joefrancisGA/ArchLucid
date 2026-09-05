namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceEvidencePointer
{
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    public string RelativePath
    {
        get;
        set;
    } = string.Empty;
}
