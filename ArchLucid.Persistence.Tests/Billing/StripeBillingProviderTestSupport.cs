using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Billing.Stripe;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

internal static class StripeBillingProviderTestSupport
{
    internal static StripeBillingProvider CreateSut(
        TestMonitor<ArchLucid.Core.Configuration.BillingOptions> monitor,
        Mock<ArchLucid.Core.Billing.IBillingLedger> ledger,
        BillingWebhookTrialActivator activator,
        Mock<ArchLucid.Core.Billing.IMarketplaceChangePlanWebhookMutationHandler> changePlan)
    {
        Mock<ILlmTenantWalletStripeWebhookProcessor> walletProcessor = new();
        Mock<ILlmTenantWalletRepository> walletRepository = new();
        walletRepository
            .Setup(r => r.TryInsertStripeWebhookIdempotencyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        return new StripeBillingProvider(
            monitor,
            ledger.Object,
            activator,
            changePlan.Object,
            walletProcessor.Object,
            walletRepository.Object);
    }
}
