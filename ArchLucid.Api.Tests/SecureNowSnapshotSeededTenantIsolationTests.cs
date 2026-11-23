using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Security;
using System.Security.Claims;
using ArchLucid.Contracts.Persistence.Graph;
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
public sealed class SecureNowSnapshotSeededTenantIsolationTests
{
    private static readonly Guid Run = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private static readonly ScopeContext A = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa"),
        ProjectId = Guid.Parse("aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa")
    };
    private static readonly ScopeContext B = new()
    {
        TenantId = Guid.Parse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
        WorkspaceId = Guid.Parse("bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb")
    };

    [Fact]
    public async Task Tenant_B_graph_is_visible_to_B_but_not_A_with_exchange_enabled()
    {
        RunRecord owned = new()
        {
            RunId = Run, TenantId = B.TenantId, WorkspaceId = B.WorkspaceId,
            ScopeProjectId = B.ProjectId, ProjectId = "tenant-b-project",
            CreatedUtc = DateTime.UtcNow.AddMinutes(-20),
            GraphSnapshotId = Guid.NewGuid()
        };
        GraphSnapshot graph = new()
        {
            RunId = Run, GraphSnapshotId = owned.GraphSnapshotId!.Value,
            ContextSnapshotId = Guid.NewGuid(), CreatedUtc = DateTime.UtcNow.AddMinutes(-10),
            Nodes = [new GraphNode { NodeId = "b-resource", NodeType = "service", Label = "Tenant B" }]
        };
        RunDetailDto detail = new() { Run = owned, GraphSnapshot = graph };

        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdAsync(A, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        runs.Setup(r => r.GetByIdAsync(B, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync(owned);
        runs.Setup(r => r.GetLatestWithGraphAtOrBeforeAsync(B, owned.ProjectId,
            It.IsAny<DateTime>(), It.IsAny<CancellationToken>())).ReturnsAsync(owned);

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(q => q.GetRunDetailAsync(B, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
        authority.Setup(q => q.GetRunDetailForManifestCompareAsync(B, Run, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = owned });

        Mock<ICentralAuthorizationDecisions> decisions = new(MockBehavior.Strict);
        decisions.Setup(d => d.DecideAsync(
            It.IsAny<ClaimsPrincipal>(),
            It.Is<CentralAuthorizationRequest>(r =>
                r.Action == "evidence.read" &&
                r.TenantId == A.TenantId && r.WorkspaceId == A.WorkspaceId &&
                r.ProjectId == A.ProjectId && r.ResourceId == Run),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(CentralAuthorizationDecision.Deny("foreign-run"));
        decisions.Setup(d => d.DecideAsync(
            It.IsAny<ClaimsPrincipal>(),
            It.Is<CentralAuthorizationRequest>(r =>
                r.Action == "evidence.read" &&
                r.TenantId == B.TenantId && r.WorkspaceId == B.WorkspaceId &&
                r.ProjectId == B.ProjectId && r.ResourceId == Run),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CentralAuthorizationDecision(true, "authorized"));

        GraphController Controller(ScopeContext scope)
        {
            Mock<IScopeContextProvider> scopeProvider = new();
            scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
            Mock<IFeatureFlags> flags = new();
            flags.Setup(f => f.IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange",
                It.IsAny<CancellationToken>())).ReturnsAsync(true);
            ServiceProvider services = new ServiceCollection()
                .AddSingleton(flags.Object)
                .AddSingleton(new EvidenceReadAuthorizationGate(decisions.Object))
                .BuildServiceProvider();
            return new GraphController(authority.Object, runs.Object, scopeProvider.Object,
                Mock.Of<IManifestHashService>(),
                Options.Create(new KnowledgeGraphLimitsOptions { FullGraphResponseMaxNodes = 500 }))
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        RequestServices = services,
                        User = new ClaimsPrincipal(new ClaimsIdentity(
                            [new Claim(ClaimTypes.NameIdentifier, "tenant-test-operator")], "test"))
                    }
                }
            };
        }

        IActionResult denied = await Controller(A).GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        denied.Should().BeOfType<NotFoundResult>();
        // Authorization rejects the foreign tenant before any repository read.
        runs.Verify(r => r.GetByIdAsync(A, Run, It.IsAny<CancellationToken>()), Times.Never);

        IActionResult allowed = await Controller(B).GetArchitectureGraphTemporalSnapshot(
            Run, DateTimeOffset.UtcNow, secureNowExchange: true);
        SecureNowSnapshotEnvelope envelope = allowed.Should().BeOfType<OkObjectResult>()
            .Subject.Value.Should().BeOfType<SecureNowSnapshotEnvelope>().Subject;
        envelope.TenantId.Should().Be(B.TenantId);
        envelope.Nodes.Should().ContainSingle().Which.NodeId.Should().Be("b-resource");
        authority.Verify(q => q.GetRunDetailAsync(A, It.IsAny<Guid>(),
            It.IsAny<CancellationToken>()), Times.Never);
        decisions.Verify(d => d.DecideAsync(
            It.IsAny<ClaimsPrincipal>(),
            It.Is<CentralAuthorizationRequest>(r => r.TenantId == A.TenantId),
            It.IsAny<CancellationToken>()), Times.Once);
        decisions.Verify(d => d.DecideAsync(
            It.IsAny<ClaimsPrincipal>(),
            It.Is<CentralAuthorizationRequest>(r => r.TenantId == B.TenantId),
            It.IsAny<CancellationToken>()), Times.Exactly(2));
        runs.Verify(r => r.GetByIdAsync(B, Run, It.IsAny<CancellationToken>()), Times.Once);
    }
}
