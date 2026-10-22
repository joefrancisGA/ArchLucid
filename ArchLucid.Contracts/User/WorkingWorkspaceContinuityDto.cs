using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.User;

/// <summary>Account-persisted Working pins and recents (IH-066).</summary>
public sealed class WorkingWorkspaceContinuityDto
{
    private List<FavoriteReviewEntryDto> favoriteReviews = [];

    public List<FavoriteReviewEntryDto> FavoriteReviews
    {
        get => favoriteReviews;
        set => favoriteReviews = ContractCollectionDefaults.Coalesce(value);
    }

    private List<OperatorRecentViewEntryDto> recentViewEntries = [];

    public List<OperatorRecentViewEntryDto> RecentViewEntries
    {
        get => recentViewEntries;
        set => recentViewEntries = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>UTC watermark for last-write-wins hydration across devices.</summary>
    public string? UpdatedAtUtc
    {
        get;
        set;
    }
}
