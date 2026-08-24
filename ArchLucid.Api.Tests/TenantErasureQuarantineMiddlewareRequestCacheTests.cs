using System.Security.Claims;

using ArchLucid.Api.Middleware;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantErasureQuarantineMiddlewareRequestCacheTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task Pipeline_trial_seat_then_erasure_quarantine_reads_tenant_once_per_request()
    {
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = TenantId,
                    Name = "Acme",
                    Slug = "acme",
                    TrialStatus = TrialLifecycleStatus.Converted,
                });

        DefaultHttpContext http = new()
        {
            Request = { Path = "/v1/runs" },
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [
                        new Claim("sub", "user-1"),
                        new Claim("tenant_id", TenantId.ToString("D")),
                    ],
                    "Bearer")),
            Response = { Body = new MemoryStream() },
        };

        ServiceCollection services = [];
        services.AddMemoryCache();
        services.AddSingleton<IHttpContextAccessor>(_ => new HttpContextAccessor { HttpContext = http });
        services.AddSingleton<IScopeContextProvider, HttpScopeContextProvider>();
        services.AddSingleton(tenants.Object);
        services.AddSingleton<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
        services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
        services.AddSingleton<TrialSeatAccountant>();
        services.AddSingleton(TimeProvider.System);
        http.RequestServices = services.BuildServiceProvider();

        RequestDelegate terminal = _ =>
        {
            http.Response.StatusCode = StatusCodes.Status200OK;

            return Task.CompletedTask;
        };

        RequestDelegate pipeline = async context =>
        {
            TenantErasureQuarantineMiddleware quarantine =
                new(new TrialSeatReservationMiddleware(terminal).InvokeAsync);
            await quarantine.InvokeAsync(context);
        };

        await pipeline(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        tenants.Verify(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Pipeline_erasure_quarantine_runs_before_trial_seat_claim_for_offboarded_trial()
    {
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            TenantId,
            "Quarantine Trial",
            "quarantine-trial",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset trialStart = new(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);
        await tenants.CommitSelfServiceTrialAsync(
            TenantId,
            trialStart,
            trialStart.AddDays(14),
            runsLimit: 10,
            seatsLimit: 3,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            CancellationToken.None);

        DateTimeOffset offboardedUtc = new(2026, 8, 20, 12, 0, 0, TimeSpan.Zero);
        (await tenants.TryStartTenantErasureOffboardAsync(
                TenantId,
                offboardedUtc,
                offboardedUtc.AddDays(30),
                CancellationToken.None))
            .Should()
            .BeTrue();

        TenantRecord before = (await tenants.GetByIdAsync(TenantId, CancellationToken.None))!;
        before.TrialSeatsUsed.Should().Be(0);

        DefaultHttpContext http = new()
        {
            Request = { Path = "/v1/runs" },
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [
                        new Claim("sub", "user-1"),
                        new Claim("tenant_id", TenantId.ToString("D")),
                    ],
                    "Bearer")),
            Response = { Body = new MemoryStream() },
        };

        ServiceCollection services = [];
        services.AddMemoryCache();
        services.AddSingleton<IHttpContextAccessor>(_ => new HttpContextAccessor { HttpContext = http });
        services.AddSingleton<IScopeContextProvider, HttpScopeContextProvider>();
        services.AddSingleton<ITenantRepository>(tenants);
        services.AddSingleton<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
        services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
        services.AddSingleton<TrialSeatAccountant>();
        services.AddSingleton(TimeProvider.System);
        http.RequestServices = services.BuildServiceProvider();

        RequestDelegate terminal = context =>
        {
            context.Response.StatusCode = StatusCodes.Status200OK;

            return Task.CompletedTask;
        };

        RequestDelegate pipeline = async context =>
        {
            TenantErasureQuarantineMiddleware quarantine =
                new(new TrialSeatReservationMiddleware(terminal).InvokeAsync);
            await quarantine.InvokeAsync(context);
        };

        await pipeline(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        TenantRecord after = (await tenants.GetByIdAsync(TenantId, CancellationToken.None))!;
        after.TrialSeatsUsed.Should().Be(0);
    }

    [Fact]
    public async Task Erasure_quarantine_allows_tenant_erasure_lifecycle_routes_for_offboarded_tenant()
    {
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            TenantId,
            "Offboarded",
            "offboarded",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset offboardedUtc = new(2026, 8, 20, 12, 0, 0, TimeSpan.Zero);
        (await tenants.TryStartTenantErasureOffboardAsync(
                TenantId,
                offboardedUtc,
                offboardedUtc.AddDays(30),
                CancellationToken.None))
            .Should()
            .BeTrue();

        foreach (string path in new[] { "/v1/tenant/erasure/approve", "/v1/tenant/erasure/legal-hold" })
        {
            DefaultHttpContext http = new()
            {
                Request = { Path = path },
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [
                            new Claim("sub", "user-1"),
                            new Claim("tenant_id", TenantId.ToString("D")),
                        ],
                        "Bearer")),
                Response = { Body = new MemoryStream() },
            };

            ServiceCollection services = [];
            services.AddMemoryCache();
            services.AddSingleton<IHttpContextAccessor>(_ => new HttpContextAccessor { HttpContext = http });
            services.AddSingleton<IScopeContextProvider, HttpScopeContextProvider>();
            services.AddSingleton<ITenantRepository>(tenants);
            services.AddSingleton<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
            services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
            services.AddSingleton<TrialSeatAccountant>();
            services.AddSingleton(TimeProvider.System);
            http.RequestServices = services.BuildServiceProvider();

            RequestDelegate terminal = context =>
            {
                context.Response.StatusCode = StatusCodes.Status204NoContent;

                return Task.CompletedTask;
            };

            TenantErasureQuarantineMiddleware middleware = new(terminal);
            await middleware.InvokeAsync(http);

            http.Response.StatusCode.Should().Be(
                StatusCodes.Status204NoContent,
                "tenant admins must approve erasure and set legal holds while quarantine is active");
        }
    }

    [Fact]
    public async Task Erasure_quarantine_still_blocks_offboarded_tenant_on_non_erasure_routes()
    {
        InMemoryTenantRepository tenants = new();
        await tenants.InsertTenantAsync(
            TenantId,
            "Offboarded",
            "offboarded-blocked",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset offboardedUtc = new(2026, 8, 20, 12, 0, 0, TimeSpan.Zero);
        (await tenants.TryStartTenantErasureOffboardAsync(
                TenantId,
                offboardedUtc,
                offboardedUtc.AddDays(30),
                CancellationToken.None))
            .Should()
            .BeTrue();

        DefaultHttpContext http = new()
        {
            Request = { Path = "/v1/runs" },
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [
                        new Claim("sub", "user-1"),
                        new Claim("tenant_id", TenantId.ToString("D")),
                    ],
                    "Bearer")),
            Response = { Body = new MemoryStream() },
        };

        ServiceCollection services = [];
        services.AddMemoryCache();
        services.AddSingleton<IHttpContextAccessor>(_ => new HttpContextAccessor { HttpContext = http });
        services.AddSingleton<IScopeContextProvider, HttpScopeContextProvider>();
        services.AddSingleton<ITenantRepository>(tenants);
        services.AddSingleton<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
        services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
        services.AddSingleton<TrialSeatAccountant>();
        services.AddSingleton(TimeProvider.System);
        http.RequestServices = services.BuildServiceProvider();

        RequestDelegate terminal = context =>
        {
            context.Response.StatusCode = StatusCodes.Status200OK;

            return Task.CompletedTask;
        };

        TenantErasureQuarantineMiddleware middleware = new(terminal);
        await middleware.InvokeAsync(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }
}
