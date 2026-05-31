using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

[Trait("Category", "Unit")]
public sealed class AdoPullRequestMarkdownEscaperTests
{
    [Fact]
    public void EscapeBulletText_escapes_markdown_metacharacters_and_newlines()
    {
        string raw = "decision [link](javascript:alert(1))\n**bold**";

        string escaped = AdoPullRequestMarkdownEscaper.EscapeBulletText(raw);

        Assert.Contains("\\[link\\]", escaped, StringComparison.Ordinal);
        Assert.Contains("\\*\\*bold\\*\\*", escaped, StringComparison.Ordinal);
        Assert.DoesNotContain('\n', escaped);
    }

    [Fact]
    public void EscapeMarkdownLinkTarget_allows_http_and_https_only()
    {
        Assert.Equal(
            "https://ops.example/app/",
            AdoPullRequestMarkdownEscaper.EscapeMarkdownLinkTarget("https://ops.example/app/"));

        Assert.Null(AdoPullRequestMarkdownEscaper.EscapeMarkdownLinkTarget("javascript:alert(1)"));
        Assert.Null(AdoPullRequestMarkdownEscaper.EscapeMarkdownLinkTarget("not-a-url"));
    }
}
