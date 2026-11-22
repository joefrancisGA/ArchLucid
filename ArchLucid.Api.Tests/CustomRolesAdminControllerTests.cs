using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;
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

    [Fact]
    public async Task CreateAsync_returns_bad_request_when_description_exceeds_max_length()
    {
        Mock<ICustomRoleService> customRoleService = new(MockBehavior.Strict);

        CustomRolesAdminController controller = new(
            customRoleService.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            Mock.Of<ILogger<CustomRolesAdminController>>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        CustomRoleUpsertRequest body = new()
        {
            Name = "Reviewer",
            Description = new string('d', 513),
            Permissions = [],
        };

        IActionResult action = await controller.CreateAsync(body, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        customRoleService.VerifyNoOtherCalls();
    }
    [Fact]
    public async Task CreateAsync_returns_created_with_resolvable_list_action_name()
    {
        Guid tenantId = Guid.NewGuid();
        CustomRoleRecord role = new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Reviewer",
            Permissions = [],
        };
        Mock<ICustomRoleService> customRoleService = new();
        customRoleService.Setup(s => s.CreateAsync(
                "Reviewer", null, It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(role);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });
        Mock<IAuditService> auditService = new();
        auditService.Setup(s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        CustomRolesAdminController controller = new(
            customRoleService.Object,
            scopeProvider.Object,
            auditService.Object,
            Mock.Of<IActorContext>(),
            Mock.Of<ILogger<CustomRolesAdminController>>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.CreateAsync(
            new CustomRoleUpsertRequest { Name = "Reviewer", Permissions = [] }, CancellationToken.None);
        CreatedAtActionResult created = action.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.ActionName.Should().Be("List", "MVC strips Async from discovered action names");
        created.Value.Should().BeOfType<CustomRoleResponse>();
        auditService.Verify(s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
