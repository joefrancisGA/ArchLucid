using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

[Trait("Category", "Unit")]
public sealed class AdoPullRequestMarkdownEscaperTests
{
    [Fact]
    public void EscapeBulletText_escapes_markdown_metacharacters_and_newlines()
    {
        string raw = "decision [link](https://example.com/path)\n**bold**";

        string escaped = AdoPullRequestMarkdownEscaper.EscapeBulletText(raw);

        Assert.Contains("\\[link\\]", escaped, StringComparison.Ordinal);
        Assert.Contains("\\*\\*bold\\*\\*", escaped, StringComparison.Ordinal);
        Assert.DoesNotContain('\n', escaped);
    }

    [Fact]
    public void EscapeBulletText_rejects_dangerous_content_markers()
    {
        Assert.Equal(string.Empty, AdoPullRequestMarkdownEscaper.EscapeBulletText("<script>alert(1)</script>"));
        Assert.Equal(string.Empty, AdoPullRequestMarkdownEscaper.EscapeBulletText("javascript:alert(1)"));
        Assert.Equal(string.Empty, AdoPullRequestMarkdownEscaper.EscapeBulletText("data:text/html,evil"));
    }

    [Fact]
    public void EscapeBulletText_truncates_to_max_safe_length()
    {
        string raw = new string('a', 600);

        string escaped = AdoPullRequestMarkdownEscaper.EscapeBulletText(raw);

        Assert.Equal(500, escaped.Length);
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
