namespace ArchLucid.Core.Configuration;

/// <summary><c>Billing:*</c> configuration (checkout + webhook providers).</summary>
public sealed class BillingOptions
{
    public const string SectionName = "Billing";

    /// <summary><see cref="BillingProviderNames" /> value.</summary>
    public string Provider
    {
        get;
        init;
    } = BillingProviderNames.Stripe;

    public StripeBillingOptions Stripe
    {
        get;
        init;
    } = new();

    public AzureMarketplaceBillingOptions AzureMarketplace
    {
        get;
        init;
    } = new();
}
