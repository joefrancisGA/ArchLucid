namespace ArchLucid.Contracts.InfraEvidence;

public sealed class OperationalSecurityFindingLookupItem
{
    public Guid FindingId
    {
        get;
        init;
    }

    public string SourceFindingId
    {
        get;
        init;
    } = string.Empty;

    public string Status
    {
        get;
        init;
    } = string.Empty;
}
