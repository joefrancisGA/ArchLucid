using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationsControllerTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    private static OperationsController CreateSut(
        Mock<IOperationQueryService>? operations = null,
        Mock<IScopeContextProvider>? scopeProvider = null,
        Mock<IOperationCancelService>? cancel = null,
        Mock<IAuditService>? audit = null)
    {
        Mock<IOperationQueryService> query = operations ?? new Mock<IOperationQueryService>();
        Mock<IOperationCancelService> cancelService = cancel ?? new Mock<IOperationCancelService>();
        Mock<IScopeContextProvider> scope = scopeProvider ?? new Mock<IScopeContextProvider>();
        Mock<IActorContext> actor = new();
        Mock<IAuditService> auditService = audit ?? new Mock<IAuditService>();
        scope.Setup(p => p.GetCurrentScope()).Returns(DefaultScope);
        actor.Setup(a => a.GetActor()).Returns("tester");

        OperationsController controller = new(
            query.Object,
            cancelService.Object,
            scope.Object,
            actor.Object,
            auditService.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        return controller;
    }

    [SkippableFact]
    public async Task GetOperation_whitespace_operationId_returns_400()
    {
        OperationsController sut = CreateSut();

        IActionResult result = await sut.GetOperation("   ", CancellationToken.None);

        ObjectResult obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [SkippableFact]
    public async Task GetOperation_unknown_returns_404()
    {
        Mock<IOperationQueryService> operations = new();
        operations
            .Setup(o => o.GetAsync("job:missing", DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OperationDetail?)null);
        OperationsController sut = CreateSut(operations);

        IActionResult result = await sut.GetOperation("job:missing", CancellationToken.None);

        ObjectResult obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [SkippableFact]
    public async Task GetOperation_found_returns_200_without_percent_complete()
    {
        OperationDetail detail = new(
            OperationIdCodec.ForJob("job-1"),
            OperationState.Succeeded,
            "Export complete",
            CurrentStep: null,
            TotalSteps: null,
            HeartbeatUtc: TimeProvider.System.GetUtcNow(),
            new OperationResultRef(null, "job-1", "/v1/jobs/job-1/file"));
        Mock<IOperationQueryService> operations = new();
        operations
            .Setup(o => o.GetAsync(detail.OperationId, DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
        OperationsController sut = CreateSut(operations);

        IActionResult result = await sut.GetOperation(detail.OperationId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        string json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
        json.Should().NotContain("percentComplete", "wire shape must not expose fake percentages (TB-2074).");
    }

    [SkippableFact]
    public async Task CancelOperation_running_returns_200_and_audits()
    {
        string operationId = OperationIdCodec.ForRun(Guid.NewGuid());
        OperationDetail cancelRequested = new(
            operationId,
            OperationState.CancelRequested,
            "Cancel requested",
            1,
            3,
            TimeProvider.System.GetUtcNow(),
            null);
        Mock<IOperationCancelService> cancel = new();
        cancel
            .Setup(c => c.RequestCancelAsync(operationId, DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cancelRequested);
        Mock<IAuditService> audit = new();
        OperationsController sut = CreateSut(cancel: cancel, audit: audit);

        IActionResult result = await sut.CancelOperation(operationId, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.Operation.CancelRequested), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
