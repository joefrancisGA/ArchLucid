using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UsersAdminControllerTests
{
    [Fact]
    public async Task InviteAsync_returns_bad_request_when_message_contains_invalid_surrogate()
    {
        Mock<IUserInvitationAdminService> invitationService = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns("admin@test");

        UsersAdminController controller = new(
            invitationService.Object,
            scopeProvider.Object,
            actorContext.Object,
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        CreateUserInvitationRequest request = new()
        {
            Email = "invitee@example.com",
            AppRole = "Reader",
            Message = "Welcome \uD800",
        };

        IActionResult action = await controller.InviteAsync(request, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        invitationService.Verify(
            s => s.InviteAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CreateUserInvitationRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
