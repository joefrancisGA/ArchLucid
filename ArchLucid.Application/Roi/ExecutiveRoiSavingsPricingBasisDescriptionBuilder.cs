using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Human-readable pricing basis and freshness labels for sponsor-facing ROI surfaces.</summary>
public static class ExecutiveRoiSavingsPricingBasisDescriptionBuilder
{
    public static string Build(
        string savingsPricingBasis,
        decimal eaDiscountMultiplier,
        RoiCostEvidenceFreshnessSnapshot freshness)
    {
        ArgumentNullException.ThrowIfNull(freshness);

        StringBuilder builder = new();
        string normalizedBasis = string.IsNullOrWhiteSpace(savingsPricingBasis)
            ? ExecutiveRoiSavingsPricingBasis.Retail
            : savingsPricingBasis.Trim();

        switch (normalizedBasis)
        {
            case ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized:
                builder.Append("Based on uploaded Azure extractor cost-actual/amortized evidence.");

                if (eaDiscountMultiplier < 1.0m)
                {
                    builder.Append(
                        CultureInfo.InvariantCulture,
                        $" Tenant EA discount multiplier {eaDiscountMultiplier:0.####} applied to cost-category findings.");
                }

                break;

            case ExecutiveRoiSavingsPricingBasis.EaAdjusted:
                builder.Append(
                    CultureInfo.InvariantCulture,
                    $"Tenant EA discount multiplier {eaDiscountMultiplier:0.####} applied to Retail-derived cost findings.");
                break;

            case ExecutiveRoiSavingsPricingBasis.HeuristicFallback:
                builder.Append("Heuristic monthly estimates used when Azure Retail SKU match is unavailable.");
                break;

            default:
                builder.Append("Azure Retail list prices (public PAYG catalog).");
                break;
        }

        AppendFreshnessNote(builder, freshness);

        return builder.ToString().Trim();
    }

    private static void AppendFreshnessNote(StringBuilder builder, RoiCostEvidenceFreshnessSnapshot freshness)
    {
        if (freshness.Status == RoiCostEvidenceFreshness.Stale)
        {
            builder.Append(
                CultureInfo.InvariantCulture,
                $" Uploaded cost evidence is stale (>{freshness.StaleAfterDays} days since collection); re-run the Azure extractor for current pricing.");

            return;
        }

        if (freshness.Status == RoiCostEvidenceFreshness.Missing)
        {
            builder.Append(" No uploaded extractor cost evidence in this workspace scope.");
        }
    }
}
