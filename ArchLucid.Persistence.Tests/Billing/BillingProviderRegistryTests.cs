using ArchLucid.Application.Billing;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;
using ArchLucid.Persistence.Billing.Stripe;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class BillingProviderRegistryTests
{
    [Theory]
    [InlineData(BillingProviderNames.Stripe)]
    [InlineData(BillingProviderNames.AzureMarketplace)]
    [InlineData(BillingProviderNames.Noop)]
    [InlineData("unknown-provider")]
    public void ResolveActiveProvider_returns_expected_provider(string providerName)
    {
        BillingProviderRegistry sut = CreateRegistry(new BillingOptions { Provider = providerName });

        IBillingProvider resolved = sut.ResolveActiveProvider();

        if (string.Equals(providerName, BillingProviderNames.Stripe, StringComparison.OrdinalIgnoreCase))
        {
            resolved.Should().BeOfType<StripeBillingProvider>();
        }
        else if (string.Equals(providerName, BillingProviderNames.AzureMarketplace, StringComparison.OrdinalIgnoreCase))
        {
            resolved.Should().BeOfType<AzureMarketplaceBillingProvider>();
        }
        else
        {
            resolved.Should().BeOfType<NoopBillingProvider>();
        }
    }

    [Fact]
    public void Ctor_null_dependency_throws()
    {
        BillingOptions billing = new();
        TestMonitor<BillingOptions> monitor = new(billing);
        NoopBillingProvider noop = new(new InMemoryBillingLedger());
        StripeBillingProvider stripe = CreateStripeProvider(monitor);
        AzureMarketplaceBillingProvider azure = CreateAzureProvider(monitor);

        Action act = () => _ = new BillingProviderRegistry(null!, noop, stripe, azure);

        act.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("billingOptions");
    }

    private static BillingProviderRegistry CreateRegistry(BillingOptions billing)
    {
        TestMonitor<BillingOptions> monitor = new(billing);
        NoopBillingProvider noop = new(new InMemoryBillingLedger());

        return new BillingProviderRegistry(
            monitor,
            noop,
            CreateStripeProvider(monitor),
            CreateAzureProvider(monitor));
    }

    private static StripeBillingProvider CreateStripeProvider(IOptionsMonitor<BillingOptions> monitor)
    {
        Mock<IBillingLedger> ledger = new();
        BillingWebhookTrialActivator activator = new(ledger.Object, new Mock<ITenantRepository>().Object, new Mock<IAuditService>().Object);
        Mock<IMarketplaceChangePlanWebhookMutationHandler> changePlan = new();
        StripeBillingSubscriptionWebhookProcessor subscriptionProcessor =
            new(ledger.Object, activator, changePlan.Object, new Mock<IAuditService>().Object);

        return StripeBillingProviderTestSupport.CreateSut(monitor, ledger, subscriptionProcessor, changePlan);
    }

    private static AzureMarketplaceBillingProvider CreateAzureProvider(IOptionsMonitor<BillingOptions> monitor)
    {
        Mock<IBillingLedger> ledger = new();
        BillingWebhookTrialActivator activator = new(ledger.Object, new Mock<ITenantRepository>().Object, new Mock<IAuditService>().Object);
        Mock<IMarketplaceWebhookTokenVerifier> verifier = new();
        Mock<IHttpClientFactory> httpFactory = new();
        MarketplaceChangePlanWebhookMutationHandler changePlanHandler = new(
            monitor,
            ledger.Object,
            NullLogger<MarketplaceChangePlanWebhookMutationHandler>.Instance);
        MarketplaceChangeQuantityWebhookMutationHandler changeQtyHandler = new(
            monitor,
            ledger.Object,
            NullLogger<MarketplaceChangeQuantityWebhookMutationHandler>.Instance);

        return new AzureMarketplaceBillingProvider(
            monitor,
            ledger.Object,
            BillingWebhookReplayGuardTestSupport.CreatePermissiveReplayGuard().Object,
            activator,
            verifier.Object,
            httpFactory.Object,
            changePlanHandler,
            changeQtyHandler);
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
