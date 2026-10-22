namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceNetworkRelationshipSummary
{
    public string RelationshipType
    {
        get;
        set;
    } = string.Empty;

    public string FromAzureResourceId
    {
        get;
        set;
    } = string.Empty;

    public string ToAzureResourceId
    {
        get;
        set;
    } = string.Empty;
}
