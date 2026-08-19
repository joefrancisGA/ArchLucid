using System.Security.Claims;

using ArchLucid.Api.Security;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;

using Moq;

namespace ArchLucid.Api.Tests.Security;

/// <summary>TB-276 unit coverage for <see cref="RouteTenantScopeBindingFilter" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RouteTenantScopeBindingFilterTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [SkippableFact]
    public async Task OnActionExecutionAsync_mismatched_route_tenant_returns_forbidden()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantB, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        RouteTenantScopeBindingFilter sut = new(scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(
            TenantA,
            "/v1/admin/tenants/" + TenantA + "/catalog-migration/default-scope");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeFalse();
        executing.Result.Should().BeOfType<StatusCodeResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_matching_route_tenant_invokes_next()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantA, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        RouteTenantScopeBindingFilter sut = new(scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(TenantA, "/v1/value-report/" + TenantA + "/generate");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeTrue();
        executing.Result.Should().BeNull();
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_internal_path_skips_binding()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantB, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        RouteTenantScopeBindingFilter sut = new(scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(
            TenantA,
            "/v1/internal/analytics/cross-tenant/daily/refresh");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeTrue();
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_platform_lifecycle_policy_skips_binding()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantB, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        RouteTenantScopeBindingFilter sut = new(scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(
            TenantA,
            "/v1/admin/tenants/" + TenantA + "/delete",
            new AuthorizeAttribute { Policy = ArchLucidPolicies.PlatformTenantDeletionAuthority });
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeTrue();
    }

    private static ActionExecutingContext BuildExecutingContext(
        Guid routeTenantId,
        string path,
        params object[] endpointMetadata)
    {
        DefaultHttpContext httpContext = new() { Request = { Path = path } };
        httpContext.User = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.Name, "unit-test")], "Bearer"));

        RouteData routeData = new();
        routeData.Values["tenantId"] = routeTenantId;

        ActionDescriptor descriptor = new() { EndpointMetadata = endpointMetadata.ToList() };

        ActionContext actionContext = new(
            httpContext,
            routeData,
            descriptor,
            new ModelStateDictionary());

        return new ActionExecutingContext(
            actionContext,
            [],
            new Dictionary<string, object?>(),
            new object());
    }

    private static ActionExecutedContext BuildExecutedContext(ActionExecutingContext executing)
    {
        return new ActionExecutedContext(executing, [], new object());
    }
}
