using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityListPageTests
{
    [Theory]
    [InlineData(1, 50, 51, true)]
    [InlineData(1, 50, 50, false)]
    [InlineData(2, 50, 51, false)]
    [InlineData(int.MaxValue, 200, 1, false)]
    [InlineData(int.MaxValue, 2, int.MaxValue, false)]
    public void HasMore_UsesNonOverflowingPageBoundary(int page, int pageSize, int totalCount, bool expected)
    {
        var result = new ArchitectureIdentityListPage
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        };

        Assert.Equal(expected, result.HasMore);
    }
}
