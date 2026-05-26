namespace ArchLucid.Core.Roi;

/// <summary>Converts between EA discount percentage and retail-price multiplier for ROI cost settings.</summary>
public static class TenantEaDiscountMath
{
    /// <summary>Retail multiplier from percentage off list price: <c>1 - (percentage / 100)</c>.</summary>
    public static decimal MultiplierFromPercentage(decimal eaDiscountPercentage)
    {
        if (eaDiscountPercentage <= 0m)
            return 1.0m;

        if (eaDiscountPercentage >= 100m)
            return 0.0001m;

        return decimal.Round(1.0m - (eaDiscountPercentage / 100m), 4, MidpointRounding.AwayFromZero);
    }

    /// <summary>Percentage off list price from stored multiplier: <c>(1 - multiplier) * 100</c>.</summary>
    public static decimal PercentageFromMultiplier(decimal eaDiscountMultiplier)
    {
        if (eaDiscountMultiplier >= 1.0m)
            return 0m;

        if (eaDiscountMultiplier <= 0m)
            return 100m;

        return decimal.Round((1.0m - eaDiscountMultiplier) * 100m, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>Effective retail price after EA discount: <c>retailPrice * multiplier</c>.</summary>
    public static decimal ApplyToRetailPrice(decimal retailPriceUsd, decimal eaDiscountMultiplier)
    {
        if (retailPriceUsd <= 0m)
            return 0m;

        decimal multiplier = eaDiscountMultiplier is > 0m and <= 1m ? eaDiscountMultiplier : 1.0m;

        return decimal.Round(retailPriceUsd * multiplier, 4, MidpointRounding.AwayFromZero);
    }
}
