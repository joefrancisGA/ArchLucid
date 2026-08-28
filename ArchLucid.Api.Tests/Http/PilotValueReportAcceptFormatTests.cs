using ArchLucid.Api.Http;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotValueReportAcceptFormatTests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("application/json", false)]
    [InlineData("text/markdown", true)]
    [InlineData("application/json, text/markdown;q=0.1", false)]
    [InlineData("text/markdown;q=0.9, application/json;q=0.1", true)]
    public void PrefersMarkdown_resolves_quality_and_order(string? acceptHeader, bool expected)
    {
        bool prefersMarkdown = PilotValueReportAcceptFormat.PrefersMarkdown(acceptHeader);

        prefersMarkdown.Should().Be(expected);
    }
}
