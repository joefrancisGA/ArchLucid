namespace ArchLucid.Contracts.Architecture;

/// <summary>Architecture identity with child draft and review summaries (ADR 0074).</summary>
public sealed class ArchitectureIdentityDetail
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

    public string? Description
    {
        get;
        set;
    }

    public string? CurrentModelId
    {
        get;
        set;
    }

    public Guid? LatestSealedManifestId
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

    public IReadOnlyList<ArchitectureIdentityChildDraftSummary> Drafts
    {
        get;
        set;
    } = [];

    public IReadOnlyList<ArchitectureIdentityChildReviewSummary> Reviews
    {
        get;
        set;
    } = [];
}
