using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Contracts;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Replay;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityReplayControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task Replay_returns_bad_request_when_mode_is_unrecognized()
    {
        Mock<IAuthorityReplayService> replayService = new(MockBehavior.Strict);

        AuthorityReplayController controller = CreateController(replayService.Object);

        ReplayRequestResponse request = new()
        {
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Mode = "DestroyEverything"
        };

        IActionResult action = await controller.Replay(request, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        replayService.Verify(
            s => s.ReplayAsync(It.IsAny<ReplayRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static AuthorityReplayController CreateController(IAuthorityReplayService replayService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        return new AuthorityReplayController(
            replayService,
            Mock.Of<IAuditService>(),
            actor.Object,
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
