namespace ArchLucid.Retrieval.Pricing;

/// <summary>Tenant ROI cost settings applied when grounding Cost-agent Retail rows (Improvement Batch 3).</summary>
public interface IAzureRetailPriceTenantCostSettingsContext
{
    Guid TenantId
    {
        get;
    }

    /// <summary>Multiplier applied to list Retail USD (default 1.0 = no EA discount).</summary>
    decimal EaDiscountMultiplier
    {
        get;
    }
}
