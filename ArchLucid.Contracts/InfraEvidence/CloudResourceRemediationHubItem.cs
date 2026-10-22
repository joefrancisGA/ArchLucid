namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceRemediationHubItem
{
    public Guid InstanceId
    {
        get;
        set;
    }

    public string PatternKey
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;
}
