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
    [InlineData("   ", false)]
    [InlineData("application/json", false)]
    [InlineData("text/markdown", true)]
    [InlineData("application/json, text/markdown;q=0.1", false)]
    [InlineData("text/markdown;q=0.9, application/json;q=0.1", true)]
    [InlineData("application/*;q=1, text/markdown;q=1", true)]
    [InlineData("text/markdown;q=0.1, text/markdown;q=0.9", true)]
    [InlineData("not-a-valid-header, text/markdown", true)]
    [InlineData("application/json;q=1, text/markdown;q=1", false)]
    [InlineData("text/markdown;q=1, application/json;q=1", true)]
    [InlineData("text/markdown;q=0.5, application/*;q=0.5", true)]
    [InlineData("application/*;q=0.5, text/markdown;q=0.5", true)]
    [InlineData("*/*", true)]
    [InlineData("text/html", false)]
    [InlineData("text/markdown;q=0, application/json", false)]
    [InlineData("application/json;q=0.9, text/markdown;q=0.8", false)]
    [InlineData("text/html, application/json;q=0.8", false)]
    public void PrefersMarkdown_resolves_quality_and_order(string? acceptHeader, bool expected)
    {
        bool prefersMarkdown = PilotValueReportAcceptFormat.PrefersMarkdown(acceptHeader);

        prefersMarkdown.Should().Be(expected);
    }
}
