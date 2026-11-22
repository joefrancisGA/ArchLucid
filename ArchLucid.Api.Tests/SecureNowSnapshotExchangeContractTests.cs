using System.Reflection;
using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecureNowSnapshotExchangeContractTests
{
    private static readonly Guid Run = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-4111-8111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-4222-8222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-4333-8333-333333333333")
    };

    private static (GraphController Controller, Mock<IRunRepository> Runs, Mock<IAuthorityQueryService> Authority)
        Build(int nodeCount, int maxNodes, bool enabled)
    {
        Mock<IFeatureFlags> flags = new();
        flags.Setup(x => x.IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange", It.IsAny<CancellationToken>()))
            .ReturnsAsync(enabled);
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(x => x.GetCurrentScope()).Returns(Scope);
        Mock<IAuthorizationService> authorization = new();
        authorization.Setup(a => a.AuthorizeAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<object>(), ArchLucidPolicies.ReadAuthority))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<IEvidenceEntitlementAuthority> entitlements = new();
        entitlements.Setup(e => e.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(true);
        ServiceProvider services = new ServiceCollection()
            .AddSingleton(flags.Object)
            .AddSingleton(scope.Object)
            .AddSingleton(authorization.Object)
            .AddSingleton(entitlements.Object)
            .AddSingleton(TimeProvider.System)
            .AddSingleton<ICentralAuthorizationAudit>(Mock.Of<ICentralAuthorizationAudit>(a => a.WriteAsync(It.IsAny<CentralAuthorizationAuditRecord>(), It.IsAny<CancellationToken>()) == Task.CompletedTask))
            .AddScoped<ICentralAuthorizationDecisions, CentralAuthorizationDecisions>()
            .AddScoped<EvidenceReadAuthorizationGate>()
            .BuildServiceProvider();
        Mock<IRunRepository> runs = new();
        RunRecord run = new() { RunId = Run, ProjectId = "proj-a", CreatedUtc = DateTime.UtcNow.AddMinutes(-10) };
        runs.Setup(x => x.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>())).ReturnsAsync(run);
        runs.Setup(x => x.GetLatestWithGraphAtOrBeforeAsync(Scope, run.ProjectId,
            It.IsAny<DateTime>(), It.IsAny<CancellationToken>())).ReturnsAsync(run);

        GraphSnapshot graph = new()
        {
            SchemaVersion = 1, RunId = Run, GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(), CreatedUtc = DateTime.UtcNow.AddMinutes(-5),
            Nodes = Enumerable.Range(0, nodeCount).Select(i => new GraphNode
                { NodeId = $"n{i}", NodeType = "resource", Label = $"Resource {i}" }).ToList()
        };
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(x => x.GetRunDetailAsync(Scope, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run, GraphSnapshot = graph });
        authority.Setup(x => x.GetRunDetailForManifestCompareAsync(Scope, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run });
        GraphController controller = new(authority.Object, runs.Object, scope.Object,
            Mock.Of<IManifestHashService>(),
            Options.Create(new KnowledgeGraphLimitsOptions { FullGraphResponseMaxNodes = maxNodes }))
        {
            ControllerContext = new ControllerContext
                { HttpContext = new DefaultHttpContext
                    {
                        RequestServices = services,
                        User = new ClaimsPrincipal(new ClaimsIdentity(
                            [new Claim(ClaimTypes.NameIdentifier, "operator"),
                             new Claim("archlucid.resource_entitlement",
                                 $"evidence.read:{Scope.TenantId:D}:{Scope.WorkspaceId:D}:{Scope.ProjectId:D}:{Run:D}")], "test"))
                    } }
        };
        return (controller, runs, authority);
    }

    [Fact]
    public void Controller_retains_read_authority_policy()
    {
        typeof(GraphController).GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.Should().Be(ArchLucidPolicies.ReadAuthority);
    }

    [Fact]
    public async Task Enabled_exchange_projects_only_authorized_scope()
    {
        var (controller, runs, authority) = Build(1, 500, true);
        IActionResult response = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        SecureNowSnapshotEnvelope envelope = response.Should().BeOfType<OkObjectResult>()
            .Subject.Value.Should().BeOfType<SecureNowSnapshotEnvelope>().Subject;
        envelope.TenantId.Should().Be(Scope.TenantId);
        envelope.WorkspaceId.Should().Be(Scope.WorkspaceId);
        envelope.ProjectId.Should().Be(Scope.ProjectId);
        envelope.ReadOnly.Should().BeTrue();
        runs.Verify(x => x.GetByIdAsync(Scope, Run, It.IsAny<CancellationToken>()), Times.Once);
        authority.Verify(x => x.GetRunDetailAsync(Scope, Run, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Oversized_exchange_is_rejected_before_projection()
    {
        var (controller, _, _) = Build(3, 2, true);
        IActionResult response = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status413PayloadTooLarge);
    }

    [Fact]
    public async Task Legacy_response_type_is_preserved_when_exchange_not_requested()
    {
        var (controller, _, _) = Build(1, 500, true);
        IActionResult response = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow);
        response.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeOfType<ArchLucid.Provenance.ArchitectureGraphTemporalSnapshotResponse>();
    }

    [Fact]
    public async Task Feature_disabled_prevents_all_scoped_repository_reads()
    {
        var (controller, runs, authority) = Build(1, 500, false);
        IActionResult response = await controller.GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        response.Should().BeOfType<NotFoundResult>();
        runs.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
    }
}
