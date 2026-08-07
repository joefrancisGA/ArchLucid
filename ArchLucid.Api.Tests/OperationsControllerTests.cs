using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
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
        Mock<IScopeContextProvider>? scopeProvider = null)
    {
        Mock<IOperationQueryService> query = operations ?? new Mock<IOperationQueryService>();
        Mock<IScopeContextProvider> scope = scopeProvider ?? new Mock<IScopeContextProvider>();
        scope.Setup(p => p.GetCurrentScope()).Returns(DefaultScope);

        OperationsController controller = new(query.Object, scope.Object)
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
}
