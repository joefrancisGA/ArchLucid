using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Middleware;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Tests.Security;

/// <summary>TB-072 coverage for <see cref="ScopeIdentityBindingMiddleware" /> header/claim binding.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopeIdentityBindingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_api_key_without_tenant_claim_rejects_x_tenant_id_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "ApiKeyAdmin")],
            AuthServiceCollectionExtensions.ApiKeySchemeName));
        context.Request.Headers["x-tenant-id"] = Guid.NewGuid().ToString("D");
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        string body = await ReadResponseBodyAsync(context);
        body.Should().Contain("x-tenant-id cannot be used without a bound key scope");
    }

    [Fact]
    public async Task InvokeAsync_api_key_with_tenant_claim_allows_matching_header()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Name, "ApiKeyAdmin"),
                new Claim("tenant_id", tenantId.ToString("D")),
                new Claim(ClaimTypes.Role, ArchLucidRoles.Admin),
            ],
            AuthServiceCollectionExtensions.ApiKeySchemeName));
        context.Request.Headers["x-tenant-id"] = tenantId.ToString("D");
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_bearer_rejects_conflicting_tenant_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("tenant_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")],
            "Bearer"));
        context.Request.Headers["x-tenant-id"] = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        string body = await ReadResponseBodyAsync(context);
        body.Should().Contain("x-tenant-id");
    }

    [Fact]
    public async Task InvokeAsync_bearer_allows_matching_tenant_header()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("tenant_id", tenantId.ToString("D"))],
            "Bearer"));
        context.Request.Headers["x-tenant-id"] = tenantId.ToString("D");
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_bearer_without_tenant_claim_rejects_x_tenant_id_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "JwtUser")],
            "Bearer"));
        context.Request.Headers["x-tenant-id"] = Guid.NewGuid().ToString("D");
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        string body = await ReadResponseBodyAsync(context);
        body.Should().Contain("tenant_id claim");
    }

    [Fact]
    public async Task InvokeAsync_bearer_with_non_guid_tenant_claim_rejects_x_tenant_id_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("tenant_id", "division-east")],
            "Bearer"));
        context.Request.Headers["x-tenant-id"] = Guid.NewGuid().ToString("D");
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task InvokeAsync_api_key_with_tenant_claim_rejects_mismatched_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Name, "ApiKeyAdmin"),
                new Claim("tenant_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ],
            AuthServiceCollectionExtensions.ApiKeySchemeName));
        context.Request.Headers["x-tenant-id"] = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task InvokeAsync_unauthenticated_request_invokes_next()
    {
        DefaultHttpContext context = CreateContext();
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_api_key_without_tenant_claim_allows_blank_x_tenant_id_header()
    {
        DefaultHttpContext context = CreateContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "ApiKeyAdmin")],
            AuthServiceCollectionExtensions.ApiKeySchemeName));
        context.Request.Headers["x-tenant-id"] = "   ";
        bool nextCalled = false;

        await RunMiddlewareAsync(context, _ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        nextCalled.Should().BeTrue();
    }

    private static DefaultHttpContext CreateContext()
    {
        DefaultHttpContext context = new() { Request = { Path = "/v1/runs" } };
        context.Response.Body = new MemoryStream();

        return context;
    }

    private static async Task RunMiddlewareAsync(HttpContext context, RequestDelegate next)
    {
        ScopeIdentityBindingMiddleware middleware = new(next);

        await middleware.InvokeAsync(context);
    }

    private static async Task<string> ReadResponseBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);

        using StreamReader reader = new(context.Response.Body, leaveOpen: true);
        string body = await reader.ReadToEndAsync();

        context.Response.Body.Seek(0, SeekOrigin.Begin);

        return body;
    }
}
