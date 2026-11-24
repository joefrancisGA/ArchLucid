using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Routing;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FileWithRangeResultTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task ExecuteResultAsync_escapes_download_filename_for_all_response_forms(
        bool rangeRequested, bool emptyPayload)
    {
        const string filename = "audit\"; inline=true; x=\"part\\one.txt";
        byte[] payload = emptyPayload ? [] : [0x01, 0x02, 0x03];
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };
        if (rangeRequested)
            http.Request.Headers.Range = "bytes=1-2";

        ActionContext action = new(http, new RouteData(), new ActionDescriptor());
        FileWithRangeResult sut = new(http.Request, payload, "application/octet-stream", filename);

        await sut.ExecuteResultAsync(action);

        http.Response.Headers["Content-Disposition"].ToString().Should().Be(
            "attachment; filename=\"audit\\\"; inline=true; x=\\\"part\\\\one.txt\"");
        http.Response.StatusCode.Should().Be(rangeRequested
            ? StatusCodes.Status206PartialContent
            : StatusCodes.Status200OK);
    }

    [Fact]
    public async Task ExecuteResultAsync_strips_crlf_from_download_filename()
    {
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };
        ActionContext action = new(http, new RouteData(), new ActionDescriptor());
        FileWithRangeResult sut = new(http.Request, [0x01], "application/octet-stream", "report\r\nInjected: 1.txt");

        await sut.ExecuteResultAsync(action);

        http.Response.Headers["Content-Disposition"].ToString()
            .Should().Be("attachment; filename=\"reportInjected: 1.txt\"");
    }

    [SkippableFact]
    public async Task ExecuteResultAsync_empty_payload_returns_200_with_zero_length()
    {
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };
        ActionContext actionContext = new(http, new RouteData(), new ActionDescriptor());
        FileWithRangeResult sut = new(http.Request, [], "application/octet-stream", "empty.bin");

        await sut.ExecuteResultAsync(actionContext);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        http.Response.ContentLength.Should().Be(0);
        http.Response.Headers["Accept-Ranges"].ToString().Should().Be("bytes");
    }

    [SkippableFact]
    public async Task ExecuteResultAsync_full_body_when_range_header_absent()
    {
        byte[] payload = [0x01, 0x02, 0x03];
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };
        ActionContext actionContext = new(http, new RouteData(), new ActionDescriptor());
        FileWithRangeResult sut = new(http.Request, payload, "application/octet-stream", "blob.bin");

        await sut.ExecuteResultAsync(actionContext);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        http.Response.ContentLength.Should().Be(payload.LongLength);
        MemoryStream body = (MemoryStream)http.Response.Body;
        body.ToArray().Should().Equal(payload);
    }

    [SkippableFact]
    public async Task ExecuteResultAsync_partial_content_when_range_valid()
    {
        byte[] payload = [0x10, 0x20, 0x30, 0x40];
        DefaultHttpContext http = new();
        http.Request.Headers.Range = "bytes=1-2";
        http.Response.Body = new MemoryStream();
        ActionContext actionContext = new(http, new RouteData(), new ActionDescriptor());
        FileWithRangeResult sut = new(http.Request, payload, "application/octet-stream", "partial.bin");

        await sut.ExecuteResultAsync(actionContext);

        http.Response.StatusCode.Should().Be(StatusCodes.Status206PartialContent);
        http.Response.ContentLength.Should().Be(2);
        http.Response.Headers.ContentRange.ToString().Should().Be("bytes 1-2/4");
        MemoryStream body = (MemoryStream)http.Response.Body;
        body.ToArray().Should().Equal(" 0"u8.ToArray());
    }
}
