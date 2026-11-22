using ArchLucid.Application.Governance;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GovernanceDashboardRecentRunCursorTests
{
    [Fact]
    public void Cursor_cycle_stops_pagination()
    {
        HashSet<string> seen = new(StringComparer.Ordinal);
        Assert.True(GovernanceDashboardRecentRunTokenAggregator.ShouldAdvanceCursor(true, "page-1", seen));
        Assert.True(GovernanceDashboardRecentRunTokenAggregator.ShouldAdvanceCursor(true, "page-2", seen));
        Assert.False(GovernanceDashboardRecentRunTokenAggregator.ShouldAdvanceCursor(true, "page-1", seen));
    }

    [Theory]
    [InlineData(false, "page-1")]
    [InlineData(true, null)]
    [InlineData(true, "")]
    public void Missing_or_terminal_cursor_stops_pagination(bool hasMore, string? cursor)
    {
        HashSet<string> seen = new(StringComparer.Ordinal);
        Assert.False(GovernanceDashboardRecentRunTokenAggregator.ShouldAdvanceCursor(hasMore, cursor, seen));
    }
}
