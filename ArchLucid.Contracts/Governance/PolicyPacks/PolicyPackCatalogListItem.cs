namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Summary row for promoted policy-pack catalog entries.</summary>
public sealed class PolicyPackCatalogListItem
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
}
