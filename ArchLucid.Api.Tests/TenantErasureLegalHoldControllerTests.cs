using System.Security.Claims;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using HostProblemTypes = ArchLucid.Host.Core.ProblemDetails.ProblemTypes;
using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantErasureLegalHoldControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_body_null()
    {
        TenantErasureLegalHoldController controller = CreateController(
            Mock.Of<ITenantErasureCommandService>(),
            Mock.Of<ITenantRepository>(),
            Mock.Of<IScopeContextProvider>());

        IActionResult action = await controller.SetLegalHoldAsync(null!, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            Mock.Of<ITenantErasureCommandService>(),
            tenants.Object,
            scopeProvider.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = DateTimeOffset.UtcNow.AddDays(30),
            Reason = "hold"
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_until_utc_is_in_the_past()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        DateTimeOffset frozenNow = DateTimeOffset.UtcNow;
        Mock<TimeProvider> timeProvider = new();
        timeProvider.Setup(t => t.GetUtcNow()).Returns(frozenNow);

        TenantErasureLegalHoldController controller = CreateController(
            Mock.Of<ITenantErasureCommandService>(),
            TenantExists(),
            scopeProvider.Object,
            timeProvider.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = frozenNow.AddDays(-1),
            Reason = "hold",
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        MvcProblemDetails problem = badRequest.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(HostProblemTypes.ValidationFailed);
        problem.Detail.Should().Be("UntilUtc must be in the future.");
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_conflict_when_command_fails()
    {
        Mock<ITenantErasureCommandService> commands = new();
        commands
            .Setup(c => c.TrySetLegalHoldAsync(
                Scope.TenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                true,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = DateTimeOffset.UtcNow.AddDays(30),
            Reason = "litigation hold"
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_no_content_when_command_succeeds()
    {
        Mock<ITenantErasureCommandService> commands = new();
        commands
            .Setup(c => c.TrySetLegalHoldAsync(
                Scope.TenantId,
                It.IsAny<DateTimeOffset>(),
                "hold",
                It.IsAny<string>(),
                It.IsAny<string>(),
                true,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = DateTimeOffset.UtcNow.AddDays(30),
            Reason = "hold"
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        action.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task ApproveErasureAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            Mock.Of<ITenantErasureCommandService>(),
            tenants.Object,
            scopeProvider.Object);

        IActionResult action = await controller.ApproveErasureAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ApproveErasureAsync_returns_conflict_when_command_fails()
    {
        Mock<ITenantErasureCommandService> commands = new();
        commands
            .Setup(c => c.TryApproveErasureAsync(
                Scope.TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object);

        IActionResult action = await controller.ApproveErasureAsync(CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task ApproveErasureAsync_returns_no_content_when_command_succeeds()
    {
        Mock<ITenantErasureCommandService> commands = new();
        commands
            .Setup(c => c.TryApproveErasureAsync(
                Scope.TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object);

        IActionResult action = await controller.ApproveErasureAsync(CancellationToken.None);

        action.Should().BeOfType<NoContentResult>();
    }

    private static ITenantRepository TenantExists()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = Scope.TenantId,
                Name = "tenant",
                Slug = "tenant",
                Tier = TenantTier.Standard,
                CreatedUtc = TimeProvider.System.GetUtcNow(),
                TrialRunsUsed = 0,
                TrialSeatsUsed = 0,
            });

        return tenants.Object;
    }

    private static TenantErasureLegalHoldController CreateController(
        ITenantErasureCommandService tenantErasureCommands,
        ITenantRepository tenantRepository,
        IScopeContextProvider scopeProvider,
        TimeProvider? timeProvider = null)
    {
        DefaultHttpContext httpContext = new();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "user-1"), new Claim(ClaimTypes.Name, "operator@test")],
            authenticationType: "test"));

        return new TenantErasureLegalHoldController(tenantErasureCommands, tenantRepository, scopeProvider, timeProvider ?? TimeProvider.System)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }
}
