using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.Stripe;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

internal static class StripeBillingProviderTestSupport
{
    internal static StripeBillingProvider CreateSut(
        IOptionsMonitor<ArchLucid.Core.Configuration.BillingOptions> monitor,
        Mock<ArchLucid.Core.Billing.IBillingLedger> ledger,
        BillingWebhookTrialActivator activator,
        Mock<ArchLucid.Core.Billing.IMarketplaceChangePlanWebhookMutationHandler> changePlan,
        Mock<ArchLucid.Core.Billing.IBillingWebhookReplayGuard>? replayGuard = null)
    {
        Mock<ILlmTenantWalletStripeWebhookProcessor> walletProcessor = new();
        Mock<ILlmTenantWalletRepository> walletRepository = new();
        walletRepository
            .Setup(r => r.TryInsertStripeWebhookIdempotencyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ArchLucid.Core.Billing.IBillingWebhookReplayGuard> replayGuardMock = replayGuard ?? new Mock<ArchLucid.Core.Billing.IBillingWebhookReplayGuard>();

        if (replayGuard is null)
        {
            replayGuardMock
                .Setup(g => g.HasSeenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
            replayGuardMock
                .Setup(g => g.RememberAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        }

        return new StripeBillingProvider(
            monitor,
            ledger.Object,
            replayGuardMock.Object,
            activator,
            changePlan.Object,
            walletProcessor.Object,
            walletRepository.Object);
    }
}
