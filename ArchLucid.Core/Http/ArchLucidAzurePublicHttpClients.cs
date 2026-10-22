namespace ArchLucid.Core.Http;

/// <summary>
///     Named <see cref="System.Net.Http.HttpClient" /> logical names and roots for outbound read-only Azure management and Retail Prices REST calls.
/// </summary>
public static class ArchLucidAzurePublicHttpClients
{
    /// <summary>ARM / Cost Management REST root (authority only).</summary>
    public static readonly Uri ResourceManagerAuthority = new("https://management.azure.com/", UriKind.Absolute);

    /// <summary>Public Retail Prices REST root.</summary>
    public static readonly Uri RetailPricesAuthority = new("https://prices.azure.com/", UriKind.Absolute);

    /// <summary><see cref="Microsoft.Extensions.Http.IHttpClientFactory" /> logical name wired with <see cref="AzureRmAndRetailPricesHttpRetryPolicy" />.</summary>
    public const string ResourceManagerHttpClientName = "ArchLucid.AzureResourceManager";

    /// <summary><see cref="Microsoft.Extensions.Http.IHttpClientFactory" /> logical name wired with <see cref="AzureRmAndRetailPricesHttpRetryPolicy" />.</summary>
    public const string RetailPricesHttpClientName = "ArchLucid.AzureRetailPrices";
}
