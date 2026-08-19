namespace ArchLucid.Core.Configuration;

/// <summary>Optional GCP Cloud Billing Catalog API key for live SKU probes (HTTPS egress only).</summary>
public sealed class GcpBillingCatalogOptions
{
    public const string SectionName = "GcpBillingCatalog";

    /// <summary>When empty, GCP live pricing probes are skipped and illustrative fallbacks apply.</summary>
    public string? ApiKey
    {
        get;

        set;
    }
}
