using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApiFileResultsTests
{
    [SkippableFact]
    public void RangeText_wraps_utf8_payload_in_file_with_range_result()
    {
        DefaultHttpContext http = new();

        IActionResult action = ApiFileResults.RangeText(http.Request, "hello", "text/plain", "greeting.txt");

        action.Should().BeOfType<FileWithRangeResult>();
    }

    [SkippableFact]
    public void SimpleBytes_returns_file_content_result_with_download_name()
    {
        IActionResult action = ApiFileResults.SimpleBytes([0x01, 0x02], "application/zip", "bundle.zip");

        FileContentResult file = action.Should().BeOfType<FileContentResult>().Subject;
        file.FileDownloadName.Should().Be("bundle.zip");
        file.ContentType.Should().Be("application/zip");
    }
}
