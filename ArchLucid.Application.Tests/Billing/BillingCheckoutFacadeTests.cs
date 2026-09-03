using ArchLucid.Application.Billing;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Billing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class BillingCheckoutFacadeTests
{
    [SkippableFact]
    public async Task CreateCheckoutSessionAsync_allows_retry_when_prior_checkout_left_pending_subscription()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        });

        InMemoryBillingLedger ledger = new();
        await ledger.UpsertPendingCheckoutAsync(
            tenantId,
            workspaceId,
            projectId,
            BillingProviderNames.Stripe,
            "cs_pending_abandoned",
            nameof(ArchLucid.Core.Tenancy.TenantTier.Standard),
            seats: 2,
            workspaces: 1,
            CancellationToken.None);

        Mock<IBillingProvider> provider = new();
        provider.SetupGet(static p => p.ProviderName).Returns(BillingProviderNames.Stripe);
        provider
            .Setup(p => p.CreateCheckoutSessionAsync(It.IsAny<BillingCheckoutRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BillingCheckoutResult
            {
                CheckoutUrl = "https://checkout.example/session",
                ProviderSessionId = "cs_retry",
            });

        Mock<IBillingProviderRegistry> registry = new();
        registry.Setup(registry => registry.ResolveActiveProvider()).Returns(provider.Object);

        BillingCheckoutFacade sut = new(
            registry.Object,
            ledger,
            scopeProvider.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<IMarketplaceWebhookConnectivityService>());

        BillingCheckoutSessionResult result = await sut.CreateCheckoutSessionAsync(
            new BillingCheckoutPostBody
            {
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel",
                TargetTier = "Team",
                Seats = 2,
                Workspaces = 1,
            },
            "admin@example.com",
            CancellationToken.None);

        result.Outcome.Should().Be(BillingCheckoutValidationOutcome.Success);
        result.Checkout.Should().NotBeNull();
        result.Checkout!.ProviderSessionId.Should().Be("cs_retry");
    }

    [SkippableFact]
    public async Task CreateCheckoutSessionAsync_blocks_when_active_subscription_exists()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid workspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid projectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        });

        InMemoryBillingLedger ledger = new();
        await ledger.ActivateSubscriptionAsync(
            tenantId,
            workspaceId,
            projectId,
            BillingProviderNames.Stripe,
            "sub_active",
            nameof(ArchLucid.Core.Tenancy.TenantTier.Standard),
            seats: 2,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        Mock<IBillingProviderRegistry> registry = new();
        registry.Setup(registry => registry.ResolveActiveProvider()).Returns(Mock.Of<IBillingProvider>());

        BillingCheckoutFacade sut = new(
            registry.Object,
            ledger,
            scopeProvider.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<IMarketplaceWebhookConnectivityService>());

        BillingCheckoutSessionResult result = await sut.CreateCheckoutSessionAsync(
            new BillingCheckoutPostBody
            {
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel",
                TargetTier = "Team",
                Seats = 2,
                Workspaces = 1,
            },
            "admin@example.com",
            CancellationToken.None);

        result.Outcome.Should().Be(BillingCheckoutValidationOutcome.ActiveSubscriptionConflict);
    }
}
