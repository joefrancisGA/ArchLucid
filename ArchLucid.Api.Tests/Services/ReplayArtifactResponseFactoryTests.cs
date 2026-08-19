using ArchLucid.Api.Services;
using ArchLucid.Application.Analysis;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.Services;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReplayArtifactResponseFactoryTests
{
    [SkippableFact]
    public void FromExportReplay_markdown_returns_file_with_range_result()
    {
        DefaultHttpContext http = new();
        ReplayExportResult result = new()
        {
            Format = "markdown",
            FileName = "replay.md",
            Content = "# heading"u8.ToArray()
        };

        IActionResult action = ReplayArtifactResponseFactory.FromExportReplay(http.Request, result);

        action.Should().BeOfType<FileWithRangeResult>();
    }

    [SkippableFact]
    public void FromExportReplay_unsupported_format_throws()
    {
        DefaultHttpContext http = new();
        ReplayExportResult result = new() { Format = "pdf", FileName = "replay.pdf", Content = [0x01] };

        Action act = () => ReplayArtifactResponseFactory.FromExportReplay(http.Request, result);

        act.Should().Throw<InvalidOperationException>();
    }

    [SkippableFact]
    public void TryComparisonReplayFile_html_returns_range_text()
    {
        DefaultHttpContext http = new();
        ReplayComparisonResult result = new()
        {
            Format = "html",
            FileName = "compare.html",
            Content = "<p>ok</p>"
        };

        IActionResult? action = ReplayArtifactResponseFactory.TryComparisonReplayFile(http.Request, result);

        action.Should().BeOfType<FileWithRangeResult>();
    }

    [SkippableFact]
    public void GetComparisonReplayEntryBytes_markdown_uses_utf8_text()
    {
        ReplayComparisonResult result = new() { Format = "markdown", Content = "alpha" };

        byte[] bytes = ReplayArtifactResponseFactory.GetComparisonReplayEntryBytes(result);

        System.Text.Encoding.UTF8.GetString(bytes).Should().Be("alpha");
    }
}
