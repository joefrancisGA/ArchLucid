using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_propagates_valid_inbound_correlation_and_sets_response_header()
    {
        const string expected = "abc-123";

        RequestDelegate next = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status200OK;

            return Task.CompletedTask;
        };

        CorrelationIdMiddleware sut = new(next);
        DefaultHttpContext context = new();
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = expected;

        await sut.InvokeAsync(context);

        context.TraceIdentifier.Should().Be(expected);
        context.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(expected);
    }

    [Fact]
    public async Task InvokeAsync_falls_back_to_trace_identifier_when_header_invalid()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        CorrelationIdMiddleware sut = new(next);
        DefaultHttpContext context = new();
        context.Request.Headers[CorrelationIdHeaderParser.HeaderName] = "!!!";

        await sut.InvokeAsync(context);

        context.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(context.TraceIdentifier);
    }
}
