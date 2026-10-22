namespace ArchLucid.Core.Http;

/// <summary>
///     Named <see cref="Microsoft.Extensions.Http.IHttpClientFactory" /> clients for outbound read-only AWS Price List
///     and GCP Cloud Billing Catalog REST calls.
/// </summary>
public static class ArchLucidMultiCloudPublicHttpClients
{
    public static readonly Uri AwsPricingAuthority =
        new("https://pricing.us-east-1.amazonaws.com/", UriKind.Absolute);

    public static readonly Uri GcpCloudBillingAuthority =
        new("https://cloudbilling.googleapis.com/", UriKind.Absolute);

    public const string AwsPricingHttpClientName = "ArchLucid.AwsPublicPricing";

    public const string GcpCloudBillingHttpClientName = "ArchLucid.GcpCloudBillingCatalog";
}
