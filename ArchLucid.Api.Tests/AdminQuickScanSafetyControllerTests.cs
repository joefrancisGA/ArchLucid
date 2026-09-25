using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.QuickScan;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminQuickScanSafetyControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PutAsync_returns_bad_request_when_reason_exceeds_max_length()
    {
        Mock<IQuickScanSafetyOperationalAdminService> adminService = new(MockBehavior.Strict);
        Mock<IQuickScanSafetyOperationalStateStore> store = new(MockBehavior.Strict);

        AdminQuickScanSafetyController controller = CreateController(adminService.Object, store.Object);

        AdminQuickScanSafetyUpdateRequest request = new()
        {
            OperationalMode = "Normal",
            Reason = new string('x', 501),
        };

        IActionResult action = await controller.PutAsync(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        adminService.VerifyNoOtherCalls();
        store.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_public_message_exceeds_max_length()
    {
        Mock<IQuickScanSafetyOperationalAdminService> adminService = new(MockBehavior.Strict);
        Mock<IQuickScanSafetyOperationalStateStore> store = new(MockBehavior.Strict);

        AdminQuickScanSafetyController controller = CreateController(adminService.Object, store.Object);

        AdminQuickScanSafetyUpdateRequest request = new()
        {
            OperationalMode = "Normal",
            Reason = "Investigating elevated error rate",
            PublicMessage = new string('m', 501),
        };

        IActionResult action = await controller.PutAsync(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        adminService.VerifyNoOtherCalls();
        store.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_reason_contains_invalid_surrogate()
    {
        Mock<IQuickScanSafetyOperationalAdminService> adminService = new(MockBehavior.Strict);
        Mock<IQuickScanSafetyOperationalStateStore> store = new(MockBehavior.Strict);

        AdminQuickScanSafetyController controller = CreateController(adminService.Object, store.Object);

        AdminQuickScanSafetyUpdateRequest request = new()
        {
            OperationalMode = "Normal",
            Reason = "\uD800",
        };

        IActionResult action = await controller.PutAsync(request, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        adminService.VerifyNoOtherCalls();
        store.VerifyNoOtherCalls();
    }

    private static AdminQuickScanSafetyController CreateController(
        IQuickScanSafetyOperationalAdminService adminService,
        IQuickScanSafetyOperationalStateStore store)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        return new AdminQuickScanSafetyController(
            adminService,
            store,
            scopeProvider.Object,
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(
                        new System.Security.Claims.ClaimsIdentity("test")),
                },
            },
        };
    }
}
