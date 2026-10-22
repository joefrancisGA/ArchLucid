namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Body for <c>POST …/policy-packs/catalog/promote</c> (snapshots source pack content into the global catalog).</summary>
public sealed class PromotePolicyPackCatalogEntryRequest
{
    /// <summary>Authoring-scope policy pack to snapshot.</summary>
    public Guid SourcePolicyPackId
    {
        get;
        set;
    }

    /// <summary>Optional version label; defaults to the pack&apos;s <c>currentVersion</c>.</summary>
    public string? Version
    {
        get;
        set;
    }
}
