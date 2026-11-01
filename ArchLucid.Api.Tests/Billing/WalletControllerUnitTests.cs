using ArchLucid.Api.Controllers.Billing;
using ArchLucid.Api.Models.Billing;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class WalletControllerUnitTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PutAsync_returns_bad_request_when_body_is_null()
    {
        Mock<ILlmTenantWalletService> wallet = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);
        Mock<IAuditService> audit = new();

        WalletController controller = CreateController(wallet.Object, scopeProvider.Object, audit.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };

        IActionResult result = await controller.PutAsync(null, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        wallet.Verify(
            w => w.UpdateWalletAsync(It.IsAny<Guid>(), It.IsAny<LlmTenantWalletUpdateCommand>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_audit_uses_actor_context_id_when_display_name_differs()
    {
        Mock<ILlmTenantWalletService> wallet = new();
        wallet
            .Setup(w => w.UpdateWalletAsync(
                Scope.TenantId,
                It.IsAny<LlmTenantWalletUpdateCommand>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LlmTenantWalletView
            {
                BalanceUsd = 10m,
                AutoReplenishEnabled = false,
                MonthlyCapUsd = 100m,
                RefillIncrementUsd = 50m,
                RefillTriggerThresholdUsd = 10m,
                RowVersion = [1, 2, 3],
            });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns("actor-id@test");

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        WalletController controller = CreateController(wallet.Object, scopeProvider.Object, audit.Object, actorContext.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(
                    new System.Security.Claims.ClaimsIdentity(
                        [new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "  Display Name  ")],
                        "test")),
            },
        };

        await controller.PutAsync(
            new LlmTenantWalletPutRequest { AutoReplenishEnabled = false },
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be("actor-id@test");
        captured.ActorUserName.Should().Be("  Display Name  ");
        captured.EventType.Should().Be(AuditEventTypes.LlmWalletSettingsUpdated);
    }

    private static WalletController CreateController(
        ILlmTenantWalletService walletService,
        IScopeContextProvider scopeProvider,
        IAuditService auditService,
        IActorContext? actorContext = null)
    {
        Mock<IOptionsMonitor<BillingOptions>> billingOptions = new();
        billingOptions.Setup(o => o.CurrentValue).Returns(new BillingOptions());

        Mock<IActorContext> actors = new();
        actors.Setup(a => a.GetActorId()).Returns("operator");

        return new WalletController(
            walletService,
            scopeProvider,
            auditService,
            actorContext ?? actors.Object,
            billingOptions.Object);
    }
}
