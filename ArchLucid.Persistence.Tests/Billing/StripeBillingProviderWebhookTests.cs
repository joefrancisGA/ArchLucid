using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class StripeBillingProviderWebhookTests
{
    [Fact]
    public async Task HandleWebhookAsync_without_signature_rejected()
    {
        BillingOptions billing = new()
        {
            Provider = BillingProviderNames.Stripe,
            Stripe = new StripeBillingOptions { WebhookSigningSecret = "whsec_test" },
        };

        TestMonitor<BillingOptions> monitor = new(billing);
        Mock<IBillingLedger> ledger = new();
        Mock<ITenantRepository> tenants = new();
        Mock<IAuditService> audit = new();
        BillingWebhookTrialActivator activator = new(ledger.Object, tenants.Object, audit.Object);
        StripeBillingProvider sut = new(monitor, ledger.Object, activator);

        BillingWebhookHandleResult result = await sut.HandleWebhookAsync(
            new BillingWebhookInbound { RawBody = "{}", StripeSignatureHeader = null },
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorDetail.Should().NotBeNullOrWhiteSpace();
        ledger.Verify(
            static l => l.TryInsertWebhookEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private sealed class TestMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        private readonly T _value = value;

        public T CurrentValue => _value;

        public T Get(string? name) => _value;

        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }
}
