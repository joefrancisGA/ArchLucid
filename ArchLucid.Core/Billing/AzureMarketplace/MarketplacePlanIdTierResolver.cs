using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Billing.AzureMarketplace;

/// <summary>
///     Maps Partner Center marketplace <c>planId</c> strings to tier storage codes via
///     <see cref="AzureMarketplaceBillingOptions.PlanIdTierMap" />.
/// </summary>
public sealed class MarketplacePlanIdTierResolver(
    IOptionsMonitor<BillingOptions> billingOptions,
    ILogger<MarketplacePlanIdTierResolver> logger) : IMarketplacePlanIdTierResolver
{
    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly ILogger<MarketplacePlanIdTierResolver> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string ResolveTierStorageCode(string? planId)
    {
        if (string.IsNullOrWhiteSpace(planId))
            return nameof(TenantTier.Standard);

        string normalizedPlanId = planId.Trim();
        IReadOnlyDictionary<string, string>? map = _billingOptions.CurrentValue.AzureMarketplace.PlanIdTierMap;

        if (map is not null)
        {
            foreach (KeyValuePair<string, string> entry in map)
            {
                if (!string.Equals(entry.Key, normalizedPlanId, StringComparison.OrdinalIgnoreCase))
                    continue;

                return NormalizeConfiguredTier(entry.Value, normalizedPlanId);
            }
        }

        RecordUnknownPlanId(normalizedPlanId);
        return nameof(TenantTier.Standard);
    }

    private string NormalizeConfiguredTier(string configuredTier, string planId)
    {
        if (string.IsNullOrWhiteSpace(configuredTier))
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Marketplace plan id {PlanId} maps to an empty tier; defaulting to Standard.",
                    planId);
            }

            return nameof(TenantTier.Standard);
        }

        string tier = configuredTier.Trim();

        if (tier.Equals(nameof(TenantTier.Standard), StringComparison.OrdinalIgnoreCase))
            return nameof(TenantTier.Standard);

        if (tier.Equals(nameof(TenantTier.Enterprise), StringComparison.OrdinalIgnoreCase))
            return nameof(TenantTier.Enterprise);

        if (tier.Equals(nameof(TenantTier.Free), StringComparison.OrdinalIgnoreCase))
            return nameof(TenantTier.Free);

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Marketplace plan id {PlanId} maps to unrecognized tier {ConfiguredTier}; defaulting to Standard.",
                planId,
                tier);
        }

        return nameof(TenantTier.Standard);
    }

    private void RecordUnknownPlanId(string planId)
    {
        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Unknown Azure Marketplace plan id {PlanId}; defaulting tier to Standard (configure Billing:AzureMarketplace:PlanIdTierMap).",
                planId);
        }

        ArchLucidInstrumentation.RecordMarketplaceUnknownPlanId();
    }
}
