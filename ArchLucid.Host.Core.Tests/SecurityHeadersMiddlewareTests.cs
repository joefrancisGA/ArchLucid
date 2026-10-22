using ArchLucid.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_adds_security_headers_for_api_paths()
    {
        bool nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        };

        SecurityHeadersMiddleware sut = new(next);
        DefaultHttpContext context = new();
        context.Request.Path = "/v1/health";

        await sut.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        IHeaderDictionary h = context.Response.Headers;

        h.Should().ContainKey("X-Content-Type-Options");
        h.Should().ContainKey("Content-Security-Policy");
        h["Content-Security-Policy"].ToString().Should().Be(SecurityHeadersMiddleware.ContentSecurityPolicyApiJson);
        h["Cache-Control"].ToString().Should().Contain("no-store");
    }

    [Fact]
    public async Task InvokeAsync_sets_public_cache_for_crawler_hint_paths()
    {
        RequestDelegate next = _ => Task.CompletedTask;
        SecurityHeadersMiddleware sut = new(next);
        DefaultHttpContext context = new();
        context.Request.Path = "/robots.txt";

        await sut.InvokeAsync(context);

        context.Response.Headers["Cache-Control"].ToString().Should().Contain("public");
    }
}
