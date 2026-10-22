namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Named <see cref="IHttpClientFactory" /> clients and roots for outbound read-only Azure management and Retail Prices REST calls.
///     Callers should resolve these via <see cref="IHttpClientFactory.CreateClient(string)" /> so Polly-backed retries apply.
/// </summary>
/// <remarks>
///     Mirrors <see cref="ArchLucid.Host.Core.Services.Delivery.WebhookOutboundHttpRetryPolicy" /> and governance SLA webhook semantics — transient transports,
///     HTTP <c>408</c>, any <c>5xx</c> (covers <see cref="System.Net.HttpStatusCode.ServiceUnavailable" />), and HTTP <c>429</c>.
/// </remarks>
public static class ArchLucidAzurePublicHttpClients
{
    /// <summary>ARM / Cost Management REST root (authority only — callers compose paths under <c>/subscriptions/{id}/...</c>).</summary>
    public static readonly Uri ResourceManagerAuthority = new("https://management.azure.com/", UriKind.Absolute);

    /// <summary>Public Retail Prices REST root (<c>/api/retail/</c> paths are appended by callers).</summary>
    public static readonly Uri RetailPricesAuthority = new("https://prices.azure.com/", UriKind.Absolute);

    /// <summary><see cref="IHttpClientFactory" /> logical name wired with <see cref="AzureRmAndRetailPricesHttpRetryPolicy" />.</summary>
    public const string ResourceManagerHttpClientName = "ArchLucid.AzureResourceManager";

    /// <summary><see cref="IHttpClientFactory" /> logical name wired with <see cref="AzureRmAndRetailPricesHttpRetryPolicy" />.</summary>
    public const string RetailPricesHttpClientName = "ArchLucid.AzureRetailPrices";
}
