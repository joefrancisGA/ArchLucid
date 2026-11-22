using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Security;
using ArchLucid.Core.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecureNowSnapshotHttpBoundaryTests
{
    private static readonly Guid Run = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-4111-8111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-4222-8222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-4333-8333-333333333333")
    };

    private static GraphController Controller(bool enabled, Mock<IRunRepository> runs, bool entitled = true)
    {
        Mock<IFeatureFlags> flags = new();
        flags.Setup(f => f.IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange", It.IsAny<CancellationToken>()))
            .ReturnsAsync(enabled);
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IAuthorizationService> authorization = new();
        authorization.Setup(a => a.AuthorizeAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<object>(), ArchLucidPolicies.ReadAuthority))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<IEvidenceEntitlementAuthority> entitlements = new();
        entitlements.Setup(e => e.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(entitled);
        ServiceProvider services = new ServiceCollection()
            .AddSingleton(flags.Object)
            .AddSingleton(scope.Object)
            .AddSingleton(authorization.Object)
            .AddSingleton(entitlements.Object)
            .AddScoped<ICentralAuthorizationDecisions, CentralAuthorizationDecisions>()
            .AddScoped<EvidenceReadAuthorizationGate>()
            .BuildServiceProvider();
        return new GraphController(Mock.Of<IAuthorityQueryService>(), runs.Object, scope.Object,
            Mock.Of<IManifestHashService>(),
            Options.Create(new KnowledgeGraphLimitsOptions { FullGraphResponseMaxNodes = 500 }))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = services,
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        entitled
                            ? [new Claim(ClaimTypes.NameIdentifier, "test-user"),
                               new Claim("archlucid.resource_entitlement",
                                   $"evidence.read:{Scope.TenantId:D}:{Scope.WorkspaceId:D}:{Scope.ProjectId:D}:{Run:D}")]
                            : [new Claim(ClaimTypes.NameIdentifier, "test-user")],
                        "test"))
                }
            }
        };
    }

    [Fact]
    public async Task Disabled_exchange_is_not_discoverable_and_does_not_query_runs()
    {
        Mock<IRunRepository> runs = new();
        GraphController controller = Controller(false, runs);
        IActionResult result = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        result.Should().BeOfType<NotFoundResult>();
        runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Enabled_exchange_does_not_retrieve_foreign_tenant_run()
    {
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        GraphController controller = Controller(true, runs);
        IActionResult result = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        runs.Verify(r => r.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Enabled_exchange_without_entitlement_never_reads_repository()
    {
        Mock<IRunRepository> runs = new();
        GraphController controller = Controller(true, runs, entitled: false);
        IActionResult result = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        result.Should().BeOfType<NotFoundResult>();
        runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Normal_temporal_route_does_not_require_securenow_feature()
    {
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        GraphController controller = Controller(false, runs);
        IActionResult result = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow);
        result.Should().BeOfType<ObjectResult>();
        runs.Verify(r => r.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>()), Times.Once);
    }
}
