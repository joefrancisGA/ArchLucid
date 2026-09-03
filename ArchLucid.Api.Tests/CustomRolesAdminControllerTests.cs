using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CustomRolesAdminControllerTests
{
    [Fact]
    public async Task UpdateAsync_returns_bad_request_when_name_contains_invalid_surrogate_like_create()
    {
        Mock<ICustomRoleService> customRoleService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAuditService> auditService = new();
        Mock<IActorContext> actorContext = new();
        Mock<ILogger<CustomRolesAdminController>> logger = new();

        CustomRolesAdminController controller = new(
            customRoleService.Object,
            scopeProvider.Object,
            auditService.Object,
            actorContext.Object,
            logger.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        CustomRoleUpsertRequest body = new()
        {
            Name = "\uD800",
            Description = "Valid description",
            Permissions = [],
        };

        IActionResult action = await controller.UpdateAsync(Guid.NewGuid(), body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        customRoleService.Verify(
            s => s.UpdateAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
