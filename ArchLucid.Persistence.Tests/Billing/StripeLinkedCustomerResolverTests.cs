using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class StripeLinkedCustomerResolverTests
{
    [Fact]
    public async Task TryResolveLinkedCustomerId_returns_null_when_stripe_secret_is_not_configured()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IBillingLedger> ledger = new();
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions
        {
            Stripe = new StripeBillingOptions { SecretKey = null },
        });

        StripeLinkedCustomerResolver resolver = new(ledger.Object, options.Object);

        string? linked = await resolver.TryResolveLinkedCustomerIdAsync(tenantId, CancellationToken.None);

        linked.Should().BeNull();
        ledger.Verify(
            l => l.TryGetProviderSubscriptionIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryResolveLinkedCustomerId_returns_null_when_ledger_has_no_provider_ref()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IBillingLedger> ledger = new();
        ledger
            .Setup(l => l.TryGetProviderSubscriptionIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions
        {
            Stripe = new StripeBillingOptions { SecretKey = "test-secret" },
        });

        StripeLinkedCustomerResolver resolver = new(ledger.Object, options.Object);

        string? linked = await resolver.TryResolveLinkedCustomerIdAsync(tenantId, CancellationToken.None);

        linked.Should().BeNull();
    }

    [Fact]
    public async Task TryResolveCustomerFromProviderRef_returns_null_for_unsupported_provider_ref_prefix()
    {
        Guid tenantId = Guid.NewGuid();

        string? customerId = await StripeLinkedCustomerResolver.TryResolveCustomerFromProviderRefAsync(
            tenantId,
            "cus_unsupported_prefix",
            "test-secret",
            CancellationToken.None);

        customerId.Should().BeNull();
    }
}
