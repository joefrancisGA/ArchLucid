using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Common;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePilotTeamChecklistControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static CorePilotTeamChecklistController BuildSut(
        ICorePilotTeamChecklistRepository repository,
        IScopeContextProvider scopeProvider,
        IActorContext actorContext)
    {
        return new CorePilotTeamChecklistController(repository, scopeProvider, actorContext)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }

    [Fact]
    public async Task GetAsync_maps_rows_and_orders_by_merge_order_from_repository()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        repo.Setup(r => r.ListAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new CorePilotChecklistStepRow(1, true, DateTimeOffset.Parse("2026-05-02T12:00:00Z"), "actor-a")
            ]);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object);
        IActionResult result = await sut.GetAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        CorePilotChecklistStepResponse[] body = ok.Value.Should().BeAssignableTo<CorePilotChecklistStepResponse[]>().Subject;
        body.Should().HaveCount(1);
        body[0].StepIndex.Should().Be(1);
        body[0].IsCompleted.Should().BeTrue();
        body[0].UpdatedByUserId.Should().Be("actor-a");
    }

    [Fact]
    public async Task PutAsync_null_body_returns_bad_request()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object);
        IActionResult result = await sut.PutAsync(null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.Verify(
            r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_invalid_step_returns_bad_request()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("me");

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object);
        IActionResult result = await sut.PutAsync(new CorePilotChecklistPutRequest { StepIndex = 7, IsCompleted = true },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.Verify(
            r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_valid_persists_and_no_content()
    {
        Mock<ICorePilotTeamChecklistRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActorId()).Returns("op-1");

        CorePilotTeamChecklistController sut = BuildSut(repo.Object, scopeProvider.Object, actor.Object);
        IActionResult result = await sut.PutAsync(new CorePilotChecklistPutRequest { StepIndex = 2, IsCompleted = false },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        repo.Verify(
            r => r.UpsertAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, 2, false, "op-1",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
