namespace ArchLucid.Contracts.User;

/// <summary>Account-persisted Working pins and recents (IH-066).</summary>
public sealed class WorkingWorkspaceContinuityDto
{
    public List<FavoriteReviewEntryDto> FavoriteReviews
    {
        get;
        set;
    } = [];

    public List<OperatorRecentViewEntryDto> RecentViewEntries
    {
        get;
        set;
    } = [];

    /// <summary>UTC watermark for last-write-wins hydration across devices.</summary>
    public string? UpdatedAtUtc
    {
        get;
        set;
    }
}
