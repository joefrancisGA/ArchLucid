using System.Security.Claims;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminTenantsControllerTests
{
    private static readonly DateTimeOffset FixedNow = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task SetTenantErasureLegalHoldPlatformAsync_returns_bad_request_when_reason_exceeds_max_length()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = TenantId,
                Name = "tenant",
                Slug = "tenant",
                Tier = TenantTier.Standard,
                CreatedUtc = FixedNow,
                TrialRunsUsed = 0,
                TrialSeatsUsed = 0,
            });

        AdminTenantsController controller = CreateController(commands.Object, tenants.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = new string('x', 501),
        };

        IActionResult action = await controller.SetTenantErasureLegalHoldPlatformAsync(
            TenantId,
            body,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        commands.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SetTenantErasureLegalHoldPlatformAsync_returns_bad_request_when_reason_contains_invalid_surrogate()
    {
        Mock<ITenantErasureCommandService> commands = new(MockBehavior.Strict);
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);

        AdminTenantsController controller = CreateController(commands.Object, tenants.Object);

        TenantErasureLegalHoldRequest body = new()
        {
            UntilUtc = FixedNow.AddDays(30),
            Reason = "\uD800",
        };

        IActionResult action = await controller.SetTenantErasureLegalHoldPlatformAsync(
            TenantId,
            body,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        commands.VerifyNoOtherCalls();
        tenants.VerifyNoOtherCalls();
    }

    private static AdminTenantsController CreateController(
        ITenantErasureCommandService tenantErasureCommands,
        ITenantRepository tenantRepository)
    {
        DefaultHttpContext httpContext = new();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "user-1"), new Claim(ClaimTypes.Name, "operator@test")],
            authenticationType: "test"));

        return new AdminTenantsController(
            tenantRepository,
            tenantErasureCommands,
            new FixedTimeProvider(FixedNow))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
