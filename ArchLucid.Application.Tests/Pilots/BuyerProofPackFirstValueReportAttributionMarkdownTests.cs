using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackFirstValueReportAttributionMarkdownTests
{
    [Fact]
    public void Generated_from_run_line_when_run_id_contains_pipe_preserves_inline_code()
    {
        FirstValueReportMarkdownFormatting.FormatGeneratedFromRunAttributionLine("run|footer")
            .Should()
            .Be("*Generated from run `run\\|footer`.*");
    }

    [Fact]
    public void Generated_from_run_line_when_run_id_contains_backtick_lengthens_fence()
    {
        FirstValueReportMarkdownFormatting.FormatGeneratedFromRunAttributionLine("run`id")
            .Should()
            .Be("*Generated from run ``run`id``.*");
    }
}
