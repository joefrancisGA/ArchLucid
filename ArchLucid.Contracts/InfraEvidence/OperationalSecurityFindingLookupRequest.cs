using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class OperationalSecurityFindingLookupRequest
{
    public string SourceSystem
    {
        get;
        init;
    } = string.Empty;

    private List<string> sourceFindingIds = [];

    public List<string> SourceFindingIds
    {
        get => sourceFindingIds;
        init => sourceFindingIds = ContractCollectionDefaults.Coalesce(value);
    }
}
