namespace ArchLucid.Retrieval.Pricing;

/// <summary>Normalizes tenant EA discount multipliers for Retail grounding (matches executive ROI rules).</summary>
public static class TenantEaDiscountMultiplierNormalizer
{
    public static decimal Normalize(decimal? raw)
    {
        if (raw is null or <= 0m or > 1m)
            return 1.0m;

        return raw.Value;
    }
}
