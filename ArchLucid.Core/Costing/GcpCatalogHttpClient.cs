using System.Text.Json;

using ArchLucid.Core.Http;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Costing;

internal sealed class GcpCatalogHttpClient
{
    private const string ComputeEngineServiceId = "6F81-5844-456A";

    private readonly Func<HttpClient> _httpFactory;

    private readonly ILogger _logger;

    public GcpCatalogHttpClient(Func<HttpClient> httpClientFactory, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(logger);

        _httpFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<decimal?> TryFetchComputeHourlyUsdAsync(string apiKey, string machineType, CancellationToken ct)
    {
        HttpClient http = _httpFactory();

        if (http.BaseAddress is null)
            http.BaseAddress = ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority;

        Uri requestUri = new(
            $"v1/services/{ComputeEngineServiceId}/skus?currencyCode=USD&key={Uri.EscapeDataString(apiKey)}",
            UriKind.Relative);

        try
        {
            using JsonDocument document = await JsonDocument.ParseAsync(
                await http.GetStreamAsync(requestUri, ct).ConfigureAwait(false),
                cancellationToken: ct).ConfigureAwait(false);

            if (!TryGetPropertyCaseInsensitive(document.RootElement, "skus", out JsonElement skus))
                return null;

            string needle = machineType.Trim();

            foreach (JsonElement sku in skus.EnumerateArray())
            {
                if (GcpSkuPricingParser.TryReadHourlyUsdFromSku(sku, needle, out decimal hourly))
                    return hourly;
            }

            return null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "GCP Billing Catalog probe failed for {MachineType}.", machineType);
            return null;
        }
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
