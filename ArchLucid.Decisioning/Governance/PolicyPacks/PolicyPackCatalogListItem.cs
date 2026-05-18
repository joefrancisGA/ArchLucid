namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Summary row for <c>GET /v1/policy-packs/catalog</c> (promoted entries only).</summary>
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
