using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Billing;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class BillingWebhookTrialActivatorTests
{
    [Fact]
    public async Task OnSubscriptionActivatedAsync_parseable_tier_invokes_ledger_tenant_conversion_and_audit()
    {
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.ActivateSubscriptionAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.MarkTrialConvertedAsync(
                It.IsAny<Guid>(),
                It.IsAny<TenantTier>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        BillingWebhookTrialActivator sut = new(ledger.Object, tenants.Object, audit.Object);

        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        CancellationToken cancellationToken = CancellationToken.None;

        await sut.OnSubscriptionActivatedAsync(
            tenantId,
            workspaceId,
            projectId,
            "stripe",
            "sub_123",
            nameof(TenantTier.Enterprise),
            "Enterprise",
            5,
            2,
            "{}",
            cancellationToken);

        ledger.Verify(l => l.ActivateSubscriptionAsync(
                tenantId,
                workspaceId,
                projectId,
                "stripe",
                "sub_123",
                nameof(TenantTier.Enterprise),
                5,
                2,
                "{}",
                cancellationToken),
            Times.Once);

        tenants.Verify(t => t.MarkTrialConvertedAsync(tenantId, TenantTier.Enterprise, cancellationToken), Times.Once);

        audit.Verify(a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.TenantTrialConverted &&
                    e.TenantId == tenantId &&
                    e.WorkspaceId == workspaceId &&
                    e.ProjectId == projectId &&
                    e.DataJson.Contains("Enterprise", StringComparison.Ordinal)),
                cancellationToken),
            Times.Once);
    }

    [Theory]
    [InlineData("not-a-valid-tier-token")]
    [InlineData("2147483647")]
    [InlineData("Free")]
    [InlineData("0")]
    public async Task OnSubscriptionActivatedAsync_invalid_commercial_tier_rejects_before_mutation(string tier)
    {
        Mock<IBillingLedger> ledger = new(MockBehavior.Strict);
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        BillingWebhookTrialActivator sut = new(ledger.Object, tenants.Object, audit.Object);

        await Assert.ThrowsAsync<ArgumentException>(() => sut.OnSubscriptionActivatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "stripe", "sub_x",
            tier, "Team", 1, 1, "[]", CancellationToken.None));

        ledger.VerifyNoOtherCalls();
        tenants.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }
}
