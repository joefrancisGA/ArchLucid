using ArchLucid.Application.Billing;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Billing.AzureMarketplace;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.Billing;

internal static class MarketplaceChangePlanHandlerTestSupport
{
    internal static Dictionary<string, string> WebhookTestPlanIdTierMap =>
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["x-enterprise"] = nameof(TenantTier.Enterprise),
        };

    internal static MarketplaceChangePlanWebhookMutationHandler CreateHandler(
        IOptionsMonitor<BillingOptions> monitor,
        IBillingLedger ledger) =>
        new(
            monitor,
            new MarketplacePlanIdTierResolver(monitor, NullLogger<MarketplacePlanIdTierResolver>.Instance),
            ledger,
            NullLogger<MarketplaceChangePlanWebhookMutationHandler>.Instance);
}
