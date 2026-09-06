namespace ArchLucid.Contracts.Architecture;

/// <summary>Summary row for tenant-scoped architecture identity portfolio lists (ADR 0074).</summary>
public sealed class ArchitectureIdentityListItem
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public string DisplayName
    {
        get;
        set;
    } = ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture;

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    public Guid? CurrentDraftId
    {
        get;
        set;
    }

    public Guid? LatestReviewId
    {
        get;
        set;
    }

    public Guid? LatestSealedManifestId
    {
        get;
        set;
    }

    public int DraftCount
    {
        get;
        set;
    }

    public int ReviewCount
    {
        get;
        set;
    }
}
