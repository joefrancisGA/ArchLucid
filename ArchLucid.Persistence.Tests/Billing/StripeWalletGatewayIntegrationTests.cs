using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing.Stripe;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Integration")]
[Trait("Suite", "Persistence")]
public sealed class StripeWalletGatewayIntegrationTests
{
    private static bool HasStripeTestCredentials()
    {
        return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_SECRET_KEY"))
               && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_CUSTOMER_ID"))
               && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_PAYMENT_METHOD_ID"));
    }

    [SkippableFact]
    public async Task ChargeRefillAsync_succeeds_against_stripe_test_fixture()
    {
        Skip.IfNot(
            HasStripeTestCredentials(),
            "Set ARCHLUCID_STRIPE_TEST_SECRET_KEY, ARCHLUCID_STRIPE_TEST_CUSTOMER_ID, and ARCHLUCID_STRIPE_TEST_PAYMENT_METHOD_ID.");

        string secretKey = Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_SECRET_KEY")!;
        string customerId = Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_CUSTOMER_ID")!;
        string paymentMethodId = Environment.GetEnvironmentVariable("ARCHLUCID_STRIPE_TEST_PAYMENT_METHOD_ID")!;

        BillingOptions options = new()
        {
            Stripe = new StripeBillingOptions { SecretKey = secretKey },
        };

        TestMonitor<BillingOptions> monitor = new(options);
        StripeWalletGateway gateway = new(monitor);
        Guid tenantId = Guid.NewGuid();
        Guid correlationId = Guid.NewGuid();

        StripeWalletChargeResult result = await gateway.ChargeRefillAsync(
            tenantId,
            customerId,
            paymentMethodId,
            50m,
            correlationId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PaymentIntentId.Should().NotBeNullOrWhiteSpace();
    }

    private sealed class TestMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
