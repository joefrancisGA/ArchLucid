namespace ArchLucid.Api.Models;

public sealed class PagingParameters
{
    public const int MaxPageSize = 200;

    public int PageNumber
    {
        get;
        set;
    } = 1;

    public int PageSize
    {
        get;
        set;
    } = 50;

    /// <summary>Returns a client-visible problem detail when paging query values are invalid; otherwise null.</summary>
    public static string? TryGetInvalidPageQueryDetail(int pageNumber, int pageSize)
    {
        // Pagination bounds only; not an authorization decision (see docs/library/CODEQL_TRIAGE.md).
        // codeql[cs/user-controlled-bypass]
        if (pageNumber < 1)
        {
            return "pageNumber must be at least 1.";
        }

        if (pageSize is < 1 or > MaxPageSize)
        {
            return $"pageSize must be between 1 and {MaxPageSize}.";
        }

        return null;
    }

    public (int Skip, int Take) Normalize()
    {
        if (PageNumber < 1)
            PageNumber = 1;
        if (PageSize < 1)
            PageSize = 1;
        if (PageSize > MaxPageSize)
            PageSize = MaxPageSize;

        long offset = ((long)PageNumber - 1) * PageSize;
        int skip = (int)Math.Min(offset, int.MaxValue);
        return (skip, PageSize);
    }
}
