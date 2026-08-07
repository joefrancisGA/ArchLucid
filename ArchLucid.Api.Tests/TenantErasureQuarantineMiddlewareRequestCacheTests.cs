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
            TrialSeatReservationMiddleware trialSeat = new(
                new TenantErasureQuarantineMiddleware(terminal).InvokeAsync);
            await trialSeat.InvokeAsync(context);
        };

        await pipeline(http);

        http.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        tenants.Verify(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
