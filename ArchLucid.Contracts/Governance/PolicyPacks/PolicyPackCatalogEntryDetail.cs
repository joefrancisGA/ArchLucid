namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Catalog entry including snapshot JSON for clone-into-tenant flows.</summary>
public sealed class PolicyPackCatalogEntryDetail
{
    public Guid PolicyPackCatalogEntryId
    {
        get;
        set;
    }

    public string DisplayName
    {
        get;
        set;
    } = null!;

    public string Description
    {
        get;
        set;
    } = null!;

    public string PackType
    {
        get;
        set;
    } = null!;

    public string SnapshotVersion
    {
        get;
        set;
    } = null!;

    public Guid SourcePolicyPackId
    {
        get;
        set;
    }

    public DateTime? PromotedUtc
    {
        get;
        set;
    }

    public string SnapshotContentJson
    {
        get;
        set;
    } = null!;
}
