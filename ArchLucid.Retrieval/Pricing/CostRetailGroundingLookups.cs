namespace ArchLucid.Retrieval.Pricing;

/// <summary>Structured retail-price lookups for Cost-agent grounding across Azure, AWS, and GCP (TB-603).</summary>
public sealed class CostRetailGroundingLookups(
    IAzureRetailPriceStructuredLookup azure,
    IAwsRetailPriceStructuredLookup aws,
    IGcpRetailPriceStructuredLookup gcp)
{
    public IAzureRetailPriceStructuredLookup Azure { get; } =
        azure ?? throw new ArgumentNullException(nameof(azure));

    public IAwsRetailPriceStructuredLookup Aws { get; } =
        aws ?? throw new ArgumentNullException(nameof(aws));

    public IGcpRetailPriceStructuredLookup Gcp { get; } =
        gcp ?? throw new ArgumentNullException(nameof(gcp));
}
