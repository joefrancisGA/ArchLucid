using System.Text.Json;

using ArchLucid.Core.Http;
using ArchLucid.Core.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Costing;

internal sealed class GcpCatalogHttpClient
{
    private const string ComputeEngineServiceId = "6F81-5844-456A";

    private readonly Func<HttpClient> _httpFactory;

    private readonly ILogger _logger;
    private readonly TimeProvider _clock;

    public GcpCatalogHttpClient(Func<HttpClient> httpClientFactory, ILogger logger, TimeProvider? clock = null)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(logger);

        _httpFactory = httpClientFactory;
        _logger = logger;
        _clock = clock ?? TimeProvider.System;
    }

    public async Task<decimal?> TryFetchComputeHourlyUsdAsync(
        string apiKey,
        string machineType,
        string? regionCode,
        CancellationToken ct)
    {
        HttpClient http = _httpFactory();

        if (http.BaseAddress is null)
            http.BaseAddress = ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority;

        string needle = machineType.Trim();
        string? pageToken = null;
        bool requireRegionMatch = !string.IsNullOrWhiteSpace(regionCode);
        decimal? matchedHourly = null;
        using OutboundOperationDeadline deadline = PricingCatalogDeadline.Start(http, _clock, ct);
        HashSet<string> seenTokens = new(StringComparer.Ordinal);

        try
        {
            do
            {
                Uri requestUri = BuildSkuListRequestUri(apiKey, pageToken);

                using Stream body = await http.GetStreamAsync(requestUri, deadline.Token).ConfigureAwait(false);
                using JsonDocument document = await JsonDocument.ParseAsync(body, cancellationToken: deadline.Token).ConfigureAwait(false);

                ct.ThrowIfCancellationRequested();

                if (deadline.IsExpired)
                    return null;

                if (!JsonObjectPropertyLookup.TryGetIgnoreCase(document.RootElement, "skus", out JsonElement skus)
                    || skus.ValueKind != JsonValueKind.Array)
                {
                    return matchedHourly;
                }

                foreach (JsonElement sku in skus.EnumerateArray())
                {
                    if (!GcpSkuPricingParser.TryReadHourlyUsdFromSku(sku, needle, regionCode, out decimal hourly))
                        continue;

                    if (requireRegionMatch)
                        return hourly;

                    matchedHourly ??= hourly;
                }

                pageToken = TryReadNextPageToken(document.RootElement);

                if (pageToken is not null && !seenTokens.Add(pageToken))
                    return null;
            }
            while (!string.IsNullOrWhiteSpace(pageToken));

            ct.ThrowIfCancellationRequested();

            return deadline.IsExpired ? null : matchedHourly;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested && deadline.IsExpired)
        {
            return null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "GCP Billing Catalog probe failed for {MachineType}.", machineType);
            return null;
        }
    }

    private static Uri BuildSkuListRequestUri(string apiKey, string? pageToken)
    {
        string query = $"currencyCode=USD&key={Uri.EscapeDataString(apiKey)}";

        if (!string.IsNullOrWhiteSpace(pageToken))
            query += $"&pageToken={Uri.EscapeDataString(pageToken)}";

        return new Uri(
            $"v1/services/{ComputeEngineServiceId}/skus?{query}",
            UriKind.Relative);
    }

    private static string? TryReadNextPageToken(JsonElement root)
    {
        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(root, "nextPageToken", out JsonElement tokenElement))
            return null;

        if (tokenElement.ValueKind != JsonValueKind.String)
            return null;

        string? token = tokenElement.GetString()?.Trim();

        return string.IsNullOrWhiteSpace(token) ? null : token;
    }
}
