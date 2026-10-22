namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceEvidenceFindingHubItem
{
    public string StreamKind
    {
        get;
        set;
    } = string.Empty;

    public string StreamLabel
    {
        get;
        set;
    } = string.Empty;

    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string? Severity
    {
        get;
        set;
    }

    public string? Status
    {
        get;
        set;
    }
}
