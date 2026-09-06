namespace ArchLucid.Contracts.Architecture;

/// <summary>Computed child pointers for an architecture identity (CA-05). Nothing here is stored on dbo.Architectures except LatestSealedManifestId on the parent record.</summary>
public sealed class ArchitectureIdentityChildPointers
{
    public Guid? CurrentOpenDraftId
    {
        get;
        set;
    }

    public string? CurrentOpenDraftSystemName
    {
        get;
        set;
    }

    public DateTime? CurrentOpenDraftUpdatedUtc
    {
        get;
        set;
    }

    public bool CurrentOpenDraftSpawnLocked
    {
        get;
        set;
    }

    public Guid? LatestReviewRunId
    {
        get;
        set;
    }

    public DateTime? LatestReviewUpdatedUtc
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
