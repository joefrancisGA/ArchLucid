using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BoardPackPdfCoverCopyTests
{
    [Fact]
    public void BuildTitle_when_custom_period_uses_window_bounds_not_calendar_quarter_label()
    {
        DateTimeOffset start = new(2026, 2, 10, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset end = new(2026, 3, 5, 0, 0, 0, TimeSpan.Zero);

        string title = BoardPackPdfCoverCopy.BuildTitle(2026, 1, start, end, customPeriod: true);

        title.Should().Contain("custom period");
        title.Should().Contain("2026-02-10T00:00:00Z");
        title.Should().Contain("2026-03-05T00:00:00Z");
        title.Should().NotContain("Q1 2026");
    }

    [Fact]
    public void BuildTitle_when_calendar_quarter_keeps_quarter_label()
    {
        DateTimeOffset start = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset end = new(2026, 4, 1, 0, 0, 0, TimeSpan.Zero);

        string title = BoardPackPdfCoverCopy.BuildTitle(2026, 1, start, end, customPeriod: false);

        title.Should().Contain("Q1 2026");
        title.Should().NotContain("custom period");
    }

    [Fact]
    public void BuildIntroParagraph_when_custom_period_does_not_claim_full_quarter_window()
    {
        string intro = BoardPackPdfCoverCopy.BuildIntroParagraph(customPeriod: true);

        intro.Should().Contain("requested period");
        intro.Should().NotContain("full quarter window");
    }

    [Fact]
    public void BuildIntroParagraph_when_calendar_quarter_mentions_full_quarter_window()
    {
        string intro = BoardPackPdfCoverCopy.BuildIntroParagraph(customPeriod: false);

        intro.Should().Contain("full quarter window");
    }
}
