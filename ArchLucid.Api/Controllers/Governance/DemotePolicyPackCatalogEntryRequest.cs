namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Body for <c>POST …/policy-packs/catalog/demote</c>.</summary>
public sealed class DemotePolicyPackCatalogEntryRequest
{
    public Guid PolicyPackCatalogEntryId
    {
        get;
        set;
    }
}
