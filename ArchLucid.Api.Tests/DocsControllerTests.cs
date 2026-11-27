using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocsControllerTests
{
    [SkippableFact]
    public void ReplayRecipes_returns_html_linking_scalar_and_replay_endpoints()
    {
        DocsController sut = new();
        DefaultHttpContext http = new()
        {
            Request = { Scheme = "https", Host = new HostString("api.example.com"), PathBase = PathString.Empty }
        };
        sut.ControllerContext = new ControllerContext { HttpContext = http };

        IActionResult result = sut.ReplayRecipes();

        ContentResult content = result.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Be("text/html");
        content.Content.Should().Contain("ArchLucid comparison replay recipes");
        content.Content.Should().Contain("https://api.example.com/scalar/v1");
        content.Content.Should().Contain("/v1/architecture/comparisons");
    }

    [Fact]
    public void ReplayRecipes_shows_parseable_request_json()
    {
        string command = GetReplayExample();
        const string dataMarker = "-d '";
        int marker = command.IndexOf(dataMarker, StringComparison.Ordinal);
        Assert.True(marker >= 0);
        int start = marker + dataMarker.Length;
        int end = command.IndexOf('\'', start);
        Assert.True(end > start);

        using JsonDocument payload = JsonDocument.Parse(command[start..end]);
        Assert.Equal("markdown", payload.RootElement.GetProperty("format").GetString());
        Assert.Equal("artifact", payload.RootElement.GetProperty("replayMode").GetString());
        Assert.False(payload.RootElement.GetProperty("persistReplay").GetBoolean());
    }

    [Fact]
    public void ReplayRecipes_uses_one_shell_continuation_until_the_last_line()
    {
        string[] lines = GetReplayExample().Split('\n');
        Assert.Equal(4, lines.Length);
        for (int i = 0; i < lines.Length - 1; i++)
        {
            string line = lines[i].TrimEnd();
            Assert.True(line.EndsWith('\\'));
            Assert.False(line.EndsWith(@"\\", StringComparison.Ordinal));
        }

        Assert.False(lines[^1].TrimEnd().EndsWith('\\'));
    }

    [Fact]
    public void ReplayRecipes_renders_css_blocks_and_preserves_the_application_path_prefix()
    {
        string html = RenderReplayRecipes();
        const string styleTag = "<style>";
        int start = html.IndexOf(styleTag, StringComparison.Ordinal) + styleTag.Length;
        int end = html.IndexOf("</style>", start, StringComparison.Ordinal);
        Assert.True(end > start);
        string css = html[start..end];

        Assert.Contains("body {", css, StringComparison.Ordinal);
        Assert.DoesNotContain("{{", css, StringComparison.Ordinal);
        Assert.DoesNotContain("}}", css, StringComparison.Ordinal);
        Assert.Contains("https://api.example.test/workspace/scalar/v1", html, StringComparison.Ordinal);
        Assert.Contains("https://api.example.test/workspace/v1/architecture/comparisons", html, StringComparison.Ordinal);
    }

    private static string GetReplayExample()
    {
        string html = RenderReplayRecipes();
        const string prefix = "<pre>curl -X POST ";
        int start = html.IndexOf(prefix, StringComparison.Ordinal);
        Assert.True(start >= 0);
        int end = html.IndexOf("</pre>", start, StringComparison.Ordinal);
        Assert.True(end > start);
        return html[(start + "<pre>".Length)..end].ReplaceLineEndings("\n");
    }

    private static string RenderReplayRecipes()
    {
        var context = new DefaultHttpContext
        {
            Request = { Scheme = "https", Host = new HostString("api.example.test"), PathBase = "/workspace" }
        };
        var controller = new DocsController { ControllerContext = new ControllerContext { HttpContext = context } };
        return Assert.IsType<ContentResult>(controller.ReplayRecipes()).Content
            ?? throw new InvalidOperationException("Expected replay recipes HTML.");
    }
}
