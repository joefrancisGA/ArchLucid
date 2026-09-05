namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceEvidenceFindingStreamPage
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

    public int Page
    {
        get;
        set;
    }

    public int PageSize
    {
        get;
        set;
    }

    public int TotalCount
    {
        get;
        set;
    }

    public bool HasMore
    {
        get;
        set;
    }

    public List<CloudResourceEvidenceFindingHubItem> Items
    {
        get;
        set;
    } = [];
}
