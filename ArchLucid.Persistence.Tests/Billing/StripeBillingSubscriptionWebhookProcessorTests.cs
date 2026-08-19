using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using Moq;

using Stripe;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class StripeBillingSubscriptionWebhookProcessorTests
{
    [Fact]
    public async Task HandleSubscriptionUpdatedAsync_past_due_suspends_subscription()
    {
        Guid tenantId = Guid.Parse("a1c0c2b0-7a4e-4c1a-9f0e-111111111111");
        Mock<IBillingLedger> ledger = new();
        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingSubscriptionWebhookProcessor sut =
            new(ledger.Object, activator, changePlan.Object, audit.Object);

        Subscription subscription = new()
        {
            Id = "sub_past_due",
            Status = "past_due",
            Metadata = new Dictionary<string, string> { ["tenant_id"] = tenantId.ToString("D") }
        };

        await sut.HandleSubscriptionUpdatedAsync(subscription, "{}", CancellationToken.None);

        ledger.Verify(l => l.SuspendSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.BillingSubscriptionSuspended),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleSubscriptionUpdatedAsync_active_reinstates_subscription()
    {
        Guid tenantId = Guid.Parse("b2d0d3c1-8b5f-5d2b-a0f1-222222222222");
        Mock<IBillingLedger> ledger = new();
        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingSubscriptionWebhookProcessor sut =
            new(ledger.Object, activator, changePlan.Object, audit.Object);

        Subscription subscription = new()
        {
            Id = "sub_active",
            Status = "active",
            Metadata = new Dictionary<string, string> { ["tenant_id"] = tenantId.ToString("D") }
        };

        await sut.HandleSubscriptionUpdatedAsync(subscription, "{}", CancellationToken.None);

        ledger.Verify(l => l.ReinstateSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleSubscriptionDeletedAsync_cancels_subscription()
    {
        Guid tenantId = Guid.Parse("c3e1e4d2-9c60-6e3c-b1f2-333333333333");
        Mock<IBillingLedger> ledger = new();
        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingSubscriptionWebhookProcessor sut =
            new(ledger.Object, activator, changePlan.Object, audit.Object);

        Subscription subscription = new()
        {
            Id = "sub_deleted",
            Metadata = new Dictionary<string, string> { ["tenant_id"] = tenantId.ToString("D") }
        };

        await sut.HandleSubscriptionDeletedAsync(subscription, "{}", CancellationToken.None);

        ledger.Verify(l => l.CancelSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleInvoicePaymentFailedAsync_suspends_by_provider_subscription_id()
    {
        Guid tenantId = Guid.Parse("d4f2f5e3-0a71-7f4d-c2e3-444444444444");
        string subscriptionId = "sub_invoice_failed";
        Mock<IBillingLedger> ledger = new();
        ledger
            .Setup(l => l.TryResolveTenantIdByProviderSubscriptionIdAsync(subscriptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenantId);

        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingSubscriptionWebhookProcessor sut =
            new(ledger.Object, activator, changePlan.Object, audit.Object);

        Invoice invoice = new()
        {
            Parent = new InvoiceParent
            {
                SubscriptionDetails = new InvoiceParentSubscriptionDetails
                {
                    SubscriptionId = subscriptionId
                }
            }
        };

        await sut.HandleInvoicePaymentFailedAsync(invoice, "{}", CancellationToken.None);

        ledger.Verify(l => l.SuspendSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
