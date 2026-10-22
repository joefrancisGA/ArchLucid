using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Fail-closed validation for <see cref="QuickScanModelPricingCatalogOptions" /> (TB-893).</summary>
public sealed class QuickScanModelPricingCatalogOptionsValidator : IValidateOptions<QuickScanModelPricingCatalogOptions>
{
    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, QuickScanModelPricingCatalogOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.MaxPricingAgeDays <= 0)
        {
            return ValidateOptionsResult.Fail(
                $"{QuickScanModelPricingCatalogOptions.SectionPath}: MaxPricingAgeDays must be greater than zero.");
        }

        List<string> failures = [];

        foreach (QuickScanModelPricingCatalogEntry entry in options.Entries)
        {
            if (string.IsNullOrWhiteSpace(entry.ModelId))
            {
                failures.Add($"{QuickScanModelPricingCatalogOptions.SectionPath}: Entries require ModelId.");
                continue;
            }

            if (entry.InputUsdPerMillionTokens < 0m || entry.OutputUsdPerMillionTokens < 0m)
            {
                failures.Add(
                    $"{QuickScanModelPricingCatalogOptions.SectionPath}: {entry.ModelId} pricing rates must be non-negative.");
            }

            if (entry.MaxContextTokens <= 0 || entry.MaxOutputTokens <= 0)
            {
                failures.Add(
                    $"{QuickScanModelPricingCatalogOptions.SectionPath}: {entry.ModelId} token limits must be positive.");
            }
        }

        if (failures.Count > 0)
        {
            return ValidateOptionsResult.Fail(failures);
        }

        return ValidateOptionsResult.Success;
    }
}
