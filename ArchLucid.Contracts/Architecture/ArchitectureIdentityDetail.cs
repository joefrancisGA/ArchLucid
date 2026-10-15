using ArchLucid.Contracts.Serialization;

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

    public DateTime? ArchivedUtc
    {
        get;
        set;
    }

    private IReadOnlyList<ArchitectureIdentityChildDraftSummary> drafts = [];

    public IReadOnlyList<ArchitectureIdentityChildDraftSummary> Drafts
    {
        get => drafts;
        set => drafts = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ArchitectureIdentityChildReviewSummary> reviews = [];

    public IReadOnlyList<ArchitectureIdentityChildReviewSummary> Reviews
    {
        get => reviews;
        set => reviews = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ArchitectureIdentityVersionSummary> versions = [];

    public IReadOnlyList<ArchitectureIdentityVersionSummary> Versions
    {
        get => versions;
        set => versions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
