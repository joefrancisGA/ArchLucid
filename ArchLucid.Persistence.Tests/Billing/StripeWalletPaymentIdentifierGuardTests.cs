using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using Stripe;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class StripeWalletPaymentIdentifierGuardTests
{
    [SkippableFact]
    public async Task AllowsWalletUpdate_false_when_customer_id_differs_from_linked_customer()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IStripeLinkedCustomerResolver> resolver = new();
        resolver
            .Setup(r => r.TryResolveLinkedCustomerIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("cus_linked");

        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions
        {
            Stripe = new StripeBillingOptions { SecretKey = "test-secret" },
        });

        StripeWalletPaymentIdentifierGuard guard = new(resolver.Object, options.Object);

        bool allowed = await guard.AllowsWalletUpdateAsync(
            tenantId,
            "cus_other",
            null,
            CancellationToken.None);

        allowed.Should().BeFalse();
    }

    [SkippableFact]
    public async Task AllowsWalletUpdate_true_when_no_stripe_ids_are_provided()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IStripeLinkedCustomerResolver> resolver = new();
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions());

        StripeWalletPaymentIdentifierGuard guard = new(resolver.Object, options.Object);

        bool allowed = await guard.AllowsWalletUpdateAsync(tenantId, null, null, CancellationToken.None);

        allowed.Should().BeTrue();
        resolver.Verify(
            r => r.TryResolveLinkedCustomerIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task AllowsWalletUpdate_false_when_linked_customer_resolver_throws_stripe_exception()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IStripeLinkedCustomerResolver> resolver = new();
        resolver
            .Setup(r => r.TryResolveLinkedCustomerIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new StripeException("no such subscription"));

        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions
        {
            Stripe = new StripeBillingOptions { SecretKey = "test-secret" },
        });

        StripeWalletPaymentIdentifierGuard guard = new(resolver.Object, options.Object);

        bool allowed = await guard.AllowsWalletUpdateAsync(
            tenantId,
            "cus_linked",
            "pm_test",
            CancellationToken.None);

        allowed.Should().BeFalse();
    }
}
