namespace ArchLucid.Contracts.InfraEvidence;

public sealed class OperationalSecurityFindingLookupRequest
{
    public string SourceSystem
    {
        get;
        init;
    } = string.Empty;

    public List<string> SourceFindingIds
    {
        get;
        init;
    } = [];
}
