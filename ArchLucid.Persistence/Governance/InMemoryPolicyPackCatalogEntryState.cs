namespace ArchLucid.Persistence.Governance;

/// <summary>Mutable row held by <see cref="InMemoryPolicyPackCatalogRepository" />.</summary>
internal sealed class InMemoryPolicyPackCatalogEntryState
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

    public string SnapshotContentJson
    {
        get;
        set;
    } = null!;

    public Guid SourcePolicyPackId
    {
        get;
        set;
    }

    public bool IsPromoted
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    public DateTime? PromotedUtc
    {
        get;
        set;
    }

    public DateTime? DemotedUtc
    {
        get;
        set;
    }
}
