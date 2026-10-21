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
        marketplace.PlanIdTierMap = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeysAndStringValues(
            marketplace.PlanIdTierMap);
    }
}
