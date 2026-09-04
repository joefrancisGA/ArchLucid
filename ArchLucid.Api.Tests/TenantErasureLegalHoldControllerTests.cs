using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Serialization;
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
    private static readonly DateTimeOffset FixedNow = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Theory]
    [InlineData("{\"reason\":\"hold\"}", "missing untilUtc")]
    public void SetLegalHoldRequest_deserialization_rejects_missing_until_utc(string payload, string because)
    {
        Action act = () => JsonSerializer.Deserialize<TenantErasureLegalHoldRequest>(
            payload,
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>(because);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_body_null()
    {
        TenantErasureLegalHoldController controller = CreateController(
            Mock.Of<ITenantErasureCommandService>(),
            Mock.Of<ITenantRepository>(),
            Mock.Of<IScopeContextProvider>(),
            new FixedTimeProvider(FixedNow));

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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = "hold"
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_until_utc_is_in_the_past_and_tenant_missing()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            tenants.Object,
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(-1),
            Reason = "hold",
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        commands.VerifyNoOtherCalls();
        tenants.Verify(
            t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_reason_exceeds_max_length_and_tenant_missing()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            tenants.Object,
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = new string('x', 501),
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        commands.VerifyNoOtherCalls();
        tenants.Verify(
            t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_until_utc_is_in_the_past()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(-1),
            Reason = "hold",
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        commands.VerifyNoOtherCalls();

        MvcProblemDetails problem = badRequest.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(HostProblemTypes.ValidationFailed);
        problem.Detail.Should().Be("UntilUtc must be in the future.");
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_reason_is_whitespace()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = "   ",
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        commands.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SetLegalHoldAsync_returns_bad_request_when_reason_exceeds_max_length()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantErasureLegalHoldController controller = CreateController(
            commands.Object,
            TenantExists(),
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = new string('x', 501),
        };

        IActionResult action = await controller.SetLegalHoldAsync(body, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        commands.VerifyNoOtherCalls();
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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

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
            scopeProvider.Object,
            new FixedTimeProvider(FixedNow));

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

        return new TenantErasureLegalHoldController(
            tenantErasureCommands,
            tenantRepository,
            scopeProvider,
            timeProvider)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
