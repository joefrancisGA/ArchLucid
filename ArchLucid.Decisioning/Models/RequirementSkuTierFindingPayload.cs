namespace ArchLucid.Decisioning.Models;

public sealed class RequirementSkuTierFindingPayload
{
    public string RequirementNodeId
    {
        get;
        set;
    } = null!;

    public string DatastoreNodeId
    {
        get;
        set;
    } = null!;

    public string RequiredRedundancy
    {
        get;
        set;
    } = null!;

    public string ObservedSku
    {
        get;
        set;
    } = null!;
}
