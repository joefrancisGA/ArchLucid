using ArchLucid.Api.Controllers.InfraEvidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationInstancesControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task List_returns_instance_summaries()
    {
        Mock<IRemediationInstanceQueryService> queryService = new();
        queryService
            .Setup(service => service.ListInstancesAsync(Scope, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RemediationInstanceSummary
                {
                    InstanceId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    FindingId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    PatternKey = "storage.encrypt-at-rest",
                    Status = RemediationInstanceStatus.Classified,
                },
            ]);

        RemediationInstancesController controller = CreateController(queryService: queryService.Object);

        IActionResult result = await controller.List(cloudResourceId: null, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        IReadOnlyList<RemediationInstanceSummary> items =
            ok.Value.Should().BeAssignableTo<IReadOnlyList<RemediationInstanceSummary>>().Subject;
        items.Should().ContainSingle();
    }

    [Fact]
    public async Task List_passes_cloudResourceId_filter_to_query_service()
    {
        Guid cloudResourceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRemediationInstanceQueryService> queryService = new();
        queryService
            .Setup(service => service.ListInstancesAsync(Scope, cloudResourceId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        RemediationInstancesController controller = CreateController(queryService: queryService.Object);

        IActionResult result = await controller.List(cloudResourceId, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        queryService.Verify(
            service => service.ListInstancesAsync(Scope, cloudResourceId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Preflight_returns_blockers_without_404_when_preflight_blocked()
    {
        Guid instanceId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IRemediationInstanceService> instanceService = new();
        instanceService
            .Setup(service => service.RunPreflightAsync(
                Scope,
                instanceId,
                It.IsAny<Guid>(),
                "actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RemediationInstanceOperationResult
            {
                Succeeded = false,
                InstanceId = instanceId,
                Status = RemediationInstanceStatus.PreflightBlocked,
                Blockers = ["Active exception blocks remediation."],
            });

        RemediationInstancesController controller = CreateController(instanceService: instanceService.Object);

        IActionResult result = await controller.Preflight(
            instanceId,
            new RemediationInstancePreflightRequest
            {
                InventorySnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        RemediationInstanceOperationResult payload =
            ok.Value.Should().BeOfType<RemediationInstanceOperationResult>().Subject;
        payload.Status.Should().Be(RemediationInstanceStatus.PreflightBlocked);
        payload.Blockers.Should().ContainSingle();
    }

    private static RemediationInstancesController CreateController(
        IRemediationInstanceService? instanceService = null,
        IRemediationInstanceQueryService? queryService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(context => context.GetActorId()).Returns("actor");

        return new RemediationInstancesController(
            instanceService ?? new Mock<IRemediationInstanceService>().Object,
            queryService ?? new Mock<IRemediationInstanceQueryService>().Object,
            scopeProvider.Object,
            actorContext.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationFactoryWorkbenchControllerTests
{
    [Fact]
    public async Task GetSummary_returns_workbench_payload()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };

        RemediationFactoryWorkbenchSummary expected = new()
        {
            FactoryMetrics = new RemediationFactoryMetrics { OpenFindings = 3 },
            OpenInstancesByStatus = new Dictionary<string, int> { ["Classified"] = 1 },
            Waves = [],
        };

        Mock<IRemediationFactoryWorkbenchQueryService> queryService = new();
        queryService
            .Setup(service => service.GetSummaryAsync(scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        RemediationFactoryWorkbenchController controller = new(queryService.Object, scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await controller.GetSummary(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}
