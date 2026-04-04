using System.Text;

using ArchiForge.Host.Core.Configuration;
using ArchiForge.Host.Core.Middleware;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ArchiForge.Api.Tests;

public sealed class PrometheusScrapeAuthMiddlewareTests
{
    private static readonly RequestDelegate NextOk = static ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status200OK;

        return Task.CompletedTask;
    };

    [Fact]
    public async Task InvokeAsync_when_scrape_credentials_configured_and_path_is_metrics_without_header_returns_401()
    {
        PrometheusScrapeAuthOptions opts = new()
        {
            ScrapeUsername = "scraper",
            ScrapePassword = "secret",
            ScrapePath = "/metrics",
        };
        PrometheusScrapeAuthMiddleware middleware = new(NextOk, Options.Create(opts));
        DefaultHttpContext http = new();
        http.Request.Method = "GET";
        http.Request.Path = "/metrics";
        http.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task InvokeAsync_when_valid_basic_auth_calls_next()
    {
        PrometheusScrapeAuthOptions opts = new()
        {
            ScrapeUsername = "scraper",
            ScrapePassword = "secret",
            ScrapePath = "/metrics",
        };
        PrometheusScrapeAuthMiddleware middleware = new(NextOk, Options.Create(opts));
        DefaultHttpContext http = new();
        http.Request.Method = "GET";
        http.Request.Path = "/metrics";
        http.Response.Body = new MemoryStream();
        string basic = Convert.ToBase64String(Encoding.UTF8.GetBytes("scraper:secret"));
        http.Request.Headers.Authorization = $"Basic {basic}";

        await middleware.InvokeAsync(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_when_credentials_configured_non_metrics_path_bypasses_auth()
    {
        PrometheusScrapeAuthOptions opts = new()
        {
            ScrapeUsername = "scraper",
            ScrapePassword = "secret",
            ScrapePath = "/metrics",
        };
        PrometheusScrapeAuthMiddleware middleware = new(NextOk, Options.Create(opts));
        DefaultHttpContext http = new();
        http.Request.Method = "GET";
        http.Request.Path = "/health/live";
        http.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_when_no_scrape_credentials_configured_metrics_path_is_open()
    {
        PrometheusScrapeAuthOptions opts = new()
        {
            ScrapeUsername = "",
            ScrapePassword = "",
            ScrapePath = "/metrics",
        };
        PrometheusScrapeAuthMiddleware middleware = new(NextOk, Options.Create(opts));
        DefaultHttpContext http = new();
        http.Request.Method = "GET";
        http.Request.Path = "/metrics";
        http.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }
}
