using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class AzureMarketplaceBillingProviderCheckoutTests
{
    [Fact]
    public async Task CreateCheckoutSessionAsync_keeps_checkout_parameters_in_query_before_fragment()
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                LandingPageUrl = "https://billing-test.invalid/landing?source=marketplace#overview"
            }
        };
        Mock<IOptionsMonitor<BillingOptions>> monitor = new();
        monitor.SetupGet(m => m.CurrentValue).Returns(billing);
        IBillingLedger ledger = Mock.Of<IBillingLedger>();
        AzureMarketplaceBillingProvider provider = new(
            monitor.Object,
            ledger,
            Mock.Of<IBillingWebhookReplayGuard>(),
            new BillingWebhookTrialActivator(ledger, Mock.Of<ITenantRepository>(), Mock.Of<IAuditService>()),
            Mock.Of<IMarketplaceWebhookTokenVerifier>(),
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<IMarketplaceChangePlanWebhookMutationHandler>(),
            Mock.Of<IMarketplaceChangeQuantityWebhookMutationHandler>());
        BillingCheckoutRequest request = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            TargetTier = BillingCheckoutTier.Team,
            ReturnUrl = "https://billing-test.invalid/complete",
            CancelUrl = "https://billing-test.invalid/cancel",
        };

        BillingCheckoutResult result = await provider.CreateCheckoutSessionAsync(request, CancellationToken.None);

        Uri checkout = new(result.CheckoutUrl);
        Assert.StartsWith($"?source=marketplace&tenantId={request.TenantId:D}", checkout.Query);
        Assert.Contains($"&workspaceId={request.WorkspaceId:D}", checkout.Query);
        Assert.Contains($"&projectId={request.ProjectId:D}", checkout.Query);
        Assert.Contains("&tier=Team", checkout.Query);
        Assert.Contains($"&session={result.ProviderSessionId}", checkout.Query);
        Assert.Equal("#overview", checkout.Fragment);
    }
}
