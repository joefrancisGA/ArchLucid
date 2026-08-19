namespace ArchLucid.Core.Configuration;

/// <summary>Authoritative pricing catalog for Quick Scan pre-execution cost estimation (TB-893).</summary>
public sealed class QuickScanModelPricingCatalogOptions
{
    public const string SectionPath = "ArchLucid:QuickScan:PricingCatalog";

    public int MaxPricingAgeDays { get; set; } = 90;

    public List<QuickScanModelPricingCatalogEntry> Entries { get; set; } = [];
}
