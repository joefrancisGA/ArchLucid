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
