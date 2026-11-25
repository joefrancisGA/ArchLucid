using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
public sealed class PagedResponseBuilderTests
{
    [Theory]
    [InlineData(4, false)]
    [InlineData(5, true)]
    public void Build_ReturnsSlice_AndDistinguishesAnExactlyFullLastPage(int totalCount, bool hasMore)
    {
        IReadOnlyList<int> all = Enumerable.Range(1, totalCount).ToArray();

        PagedResponse<int> page = PagedResponseBuilder.Build(all, 2, 2);

        page.Items.Should().Equal(3, 4);
        page.TotalCount.Should().Be(totalCount);
        page.Page.Should().Be(2);
        page.PageSize.Should().Be(2);
        page.HasMore.Should().Be(hasMore);
    }

    [Fact]
    public void FromDatabasePage_PreservesItems_AndNormalizesPaging()
    {
        IReadOnlyList<string> items = ["a"];

        PagedResponse<string> page = PagedResponseBuilder.FromDatabasePage(items, 99, 0, 5);

        page.Items.Should().Equal("a");
        page.TotalCount.Should().Be(99);
        page.Page.Should().Be(1);
        page.PageSize.Should().Be(5);
    }

    [Fact]
    public void HasMore_ExtremePage_DoesNotOverflow()
    {
        PagedResponse<int> page = new() { Page = int.MaxValue, PageSize = 200, TotalCount = 5 };

        page.HasMore.Should().BeFalse();
    }
}
