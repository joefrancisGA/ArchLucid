namespace ArchLucid.Contracts.User;

/// <summary>Pinned architecture review package row for Working workspace continuity (IH-066).</summary>
public sealed class FavoriteReviewEntryDto
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string? Title
    {
        get;
        set;
    }

    public string PinnedAtUtc
    {
        get;
        set;
    } = string.Empty;
}
