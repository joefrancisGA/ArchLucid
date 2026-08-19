using System.Security.Claims;

using ArchLucid.Api.Middleware;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Api.Tests.Security;

/// <summary>TB-304 integration-style coverage for <see cref="ScopeResolutionGuardMiddleware" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopeResolutionGuardMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_development_host_allows_default_scope()
    {
        DefaultHttpContext context = CreateContext("/v1/runs");
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Development,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_staging_host_rejects_default_scope()
    {
        DefaultHttpContext context = CreateContext("/v1/runs");
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Staging,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task InvokeAsync_staging_host_allows_claim_bound_scope()
    {
        Guid tenant = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DefaultHttpContext context = CreateContext("/v1/runs");
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim("tenant_id", tenant.ToString("D")),
                new Claim("workspace_id", Guid.NewGuid().ToString("D")),
                new Claim("project_id", Guid.NewGuid().ToString("D")),
            ],
            "Bearer"));
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Staging,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_staging_host_skips_allow_unscoped_route_metadata()
    {
        DefaultHttpContext context = CreateContext("/v1/demo/preview");
        context.SetEndpoint(new Endpoint(
            _ => Task.CompletedTask,
            new EndpointMetadataCollection(new AllowUnscopedRouteAttribute()),
            "demo-preview"));
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Staging,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_staging_host_skips_health_paths()
    {
        DefaultHttpContext context = CreateContext("/health/live");
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Staging,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_staging_host_skips_openapi_paths()
    {
        DefaultHttpContext context = CreateContext("/openapi/v1.json");
        bool nextCalled = false;

        await RunMiddlewareAsync(
            context,
            Environments.Staging,
            new Dictionary<string, string?>(),
            _ =>
            {
                nextCalled = true;

                return Task.CompletedTask;
            });

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    private static DefaultHttpContext CreateContext(string path)
    {
        DefaultHttpContext context = new() { Request = { Path = path } };
        context.Response.Body = new MemoryStream();

        return context;
    }

    private static async Task RunMiddlewareAsync(
        HttpContext context,
        string environmentName,
        Dictionary<string, string?> configurationValues,
        RequestDelegate next)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationValues)
            .Build();
        HostEnvironment hostEnvironment = new() { EnvironmentName = environmentName };
        IHttpContextAccessor accessor = new HttpContextAccessor { HttpContext = context };
        HttpScopeContextProvider scopeProvider = new(accessor);
        ScopeResolutionGuardMiddleware middleware = new(next, hostEnvironment, configuration);

        await middleware.InvokeAsync(context, scopeProvider);
    }

    private sealed class HostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Api.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
