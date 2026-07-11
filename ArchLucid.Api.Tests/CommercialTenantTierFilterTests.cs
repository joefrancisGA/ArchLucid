using System.Security.Claims;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Filters;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="CommercialTenantTierFilter" />: unauthenticated callers skip tier checks;
///     Standard-minimum denial returns <see cref="StatusCodes.Status403Forbidden"/> with packaging problem details;
///     Enterprise-only gates return <see cref="StatusCodes.Status404NotFound"/> (enumeration suppression).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommercialTenantTierFilterTests
{
    [SkippableFact]
    public async Task OnActionExecutionAsync_unauthenticated_invokes_next_without_tenant_lookup()
    {
        Mock<ITenantRepository> tenants = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        CommercialTenantTierFilter sut = BuildFilter(TenantTier.Standard, tenants.Object, scopeProvider.Object);

        ActionExecutingContext executing = BuildExecutingContext(authenticated: false);
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
        tenants.Verify(
            static t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_free_tier_minimum_standard_returns_403_packaging_problem()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "t",
                    Slug = "t",
                    Tier = TenantTier.Free,
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                    TrialRunsUsed = 0,
                    TrialSeatsUsed = 0
                });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CommercialTenantTierFilter sut = BuildFilter(TenantTier.Standard, tenants.Object, scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(authenticated: true);
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeFalse();
        ObjectResult? obj = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            obj.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.PackagingTierInsufficient);
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_missing_tenant_development_bypass_standard_gate_invokes_next()
    {
        Guid tenantId = Guid.Parse("dddddddd-eeee-ffff-1111-222222222222");

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CommercialTenantTierFilter sut = BuildFilter(
            TenantTier.Standard,
            tenants.Object,
            scopeProvider.Object,
            isDevelopmentHost: true,
            authMode: "DevelopmentBypass",
            allowTestActorHeaders: true);
        ActionExecutingContext executing = BuildExecutingContext(authenticated: true);
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
    public async Task OnActionExecutionAsync_missing_tenant_development_bypass_enterprise_gate_returns_404()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-ffff-1111-2222-333333333333");

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CommercialTenantTierFilter sut = BuildFilter(
            TenantTier.Enterprise,
            tenants.Object,
            scopeProvider.Object,
            isDevelopmentHost: true,
            authMode: "DevelopmentBypass",
            allowTestActorHeaders: true);
        ActionExecutingContext executing = BuildExecutingContext(authenticated: true);
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeFalse();
        ObjectResult? obj = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [SkippableFact]
    public void ShouldTreatMissingTenantAsStandardDevelopmentBypass_requires_standard_minimum_tier()
    {
        CommercialTenantTierFilter.ShouldTreatMissingTenantAsStandardDevelopmentBypass(
                isDevelopmentHost: true,
                authMode: "DevelopmentBypass",
                allowTestActorHeaders: true,
                minimumTier: TenantTier.Enterprise)
            .Should()
            .BeFalse();
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_standard_tier_minimum_enterprise_denial_returns_404()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-999999999999");

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "t",
                    Slug = "t",
                    Tier = TenantTier.Standard,
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                    TrialRunsUsed = 0,
                    TrialSeatsUsed = 0
                });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CommercialTenantTierFilter sut = BuildFilter(TenantTier.Enterprise, tenants.Object, scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(authenticated: true);
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(BuildExecutedContext(executing));
            });

        next.Should().BeFalse();
        ObjectResult? obj = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            obj.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ResourceNotFound);
    }

    [SkippableFact]
    public async Task OnActionExecutionAsync_standard_tier_meets_minimum_standard_invokes_next()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "t",
                    Slug = "t",
                    Tier = TenantTier.Standard,
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                    TrialRunsUsed = 0,
                    TrialSeatsUsed = 0
                });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope())
            .Returns(
                new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CommercialTenantTierFilter sut = BuildFilter(TenantTier.Standard, tenants.Object, scopeProvider.Object);
        ActionExecutingContext executing = BuildExecutingContext(authenticated: true);
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

    private static CommercialTenantTierFilter BuildFilter(
        TenantTier minimumTier,
        ITenantRepository tenantRepository,
        IScopeContextProvider scopeContextProvider,
        bool isDevelopmentHost = false,
        string authMode = "ApiKey",
        bool allowTestActorHeaders = false)
    {
        Mock<IWebHostEnvironment> hostEnvironment = new();
        hostEnvironment.Setup(h => h.EnvironmentName).Returns(isDevelopmentHost ? "Development" : "Production");

        IOptions<ArchLucidAuthOptions> authOptions = Options.Create(
            new ArchLucidAuthOptions { Mode = authMode, AllowTestActorHeaders = allowTestActorHeaders });

        return new CommercialTenantTierFilter(
            minimumTier,
            tenantRepository,
            scopeContextProvider,
            hostEnvironment.Object,
            authOptions);
    }

    private static ActionExecutingContext BuildExecutingContext(bool authenticated)
    {
        DefaultHttpContext httpContext = new()
        {
            Request = { Path = "/v1.0/graph/runs/00000000-0000-0000-0000-000000000001" }
        };

        if (authenticated)
        {
            httpContext.User = new ClaimsPrincipal(
                new ClaimsIdentity([new Claim(ClaimTypes.Name, "unit-test")], "Bearer"));
        }

        ActionContext actionContext = new(
            httpContext,
            new RouteData(),
            new ActionDescriptor(),
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
