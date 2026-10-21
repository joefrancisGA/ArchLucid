using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="BillingOptions" /> after configuration binding.</summary>
public sealed class BillingOptionsNormalizePostConfigure : IPostConfigureOptions<BillingOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, BillingOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        NormalizePlanIdTierMap(options.AzureMarketplace);
    }

    private static void NormalizePlanIdTierMap(AzureMarketplaceBillingOptions marketplace)
    {
        Dictionary<string, string>? map = marketplace.PlanIdTierMap;

        if (map is not { Count: > 0 })
            return;

        Dictionary<string, string> normalized = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> entry in map)
        {

            if (string.IsNullOrWhiteSpace(entry.Key))
                continue;

            string key = entry.Key.Trim();
            string tier = entry.Value is null ? string.Empty : entry.Value.Trim();
            normalized[key] = tier;
        }

        marketplace.PlanIdTierMap = normalized;
    }
}
