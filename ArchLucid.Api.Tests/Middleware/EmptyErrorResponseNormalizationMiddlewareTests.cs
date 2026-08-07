using System.Text.Json;

using ArchLucid.Api.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests.Middleware;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class EmptyErrorResponseNormalizationMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_fills_empty_404_with_problem_json()
    {
        DefaultHttpContext context = new()
        {
            Response = { Body = new MemoryStream(), StatusCode = StatusCodes.Status404NotFound }
        };
        context.Request.Path = "/v1/architecture/review/not-a-guid";

        EmptyErrorResponseNormalizationMiddleware sut = new(_ =>
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        });

        await sut.InvokeAsync(context);

        context.Response.ContentType.Should().StartWith("application/problem+json");
        context.Response.Body.Position = 0;
        using JsonDocument doc = await JsonDocument.ParseAsync(context.Response.Body);
        doc.RootElement.GetProperty("status").GetInt32().Should().Be(404);
        doc.RootElement.GetProperty("title").GetString().Should().Be("Not Found");
    }

    [Fact]
    public async Task InvokeAsync_skips_when_content_type_already_set()
    {
        DefaultHttpContext context = new()
        {
            Response =
            {
                Body = new MemoryStream(),
                StatusCode = StatusCodes.Status404NotFound,
                ContentType = "text/plain"
            }
        };

        EmptyErrorResponseNormalizationMiddleware sut = new(_ => Task.CompletedTask);

        await sut.InvokeAsync(context);

        context.Response.ContentType.Should().Be("text/plain");
        context.Response.Body.Length.Should().Be(0);
    }
}
