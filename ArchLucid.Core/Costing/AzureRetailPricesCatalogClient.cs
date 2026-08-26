using System.Collections.Concurrent;
using System.Net.Http.Json;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Best-effort Azure Retail Prices (consumption) lookups with paging and TTL caching.</summary>
public sealed partial class AzureRetailPricesCatalogClient
{
    internal const double HoursPerMonthAssumption = 730d;

    private const int MaxPagesPerProbe = 6;

    private static readonly TimeSpan NegativeCacheLifetime = TimeSpan.FromMinutes(45);

    private static readonly TimeSpan PositiveCacheLifetime = TimeSpan.FromHours(24);

    private readonly Func<HttpClient> _httpFactory;

    private readonly TimeProvider _clock;

    private readonly ILogger<AzureRetailPricesCatalogClient> _logger;

    private readonly ConcurrentDictionary<string, CachedLookup> _cache = new();

    /// <summary>Uses the public Retail Prices API (consumption meters) with outbound HTTP wired by callers.</summary>
    /// <param name="httpClientFactory">Produces <see cref="HttpClient"/> instances rooted at Retail Prices.</param>
    public AzureRetailPricesCatalogClient(Func<HttpClient> httpClientFactory, TimeProvider clock, ILogger<AzureRetailPricesCatalogClient>? logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(clock);

        _httpFactory = httpClientFactory;
        _clock = clock;
        _logger = logger ?? NullLogger<AzureRetailPricesCatalogClient>.Instance;
    }

    /// <inheritdoc cref="TryGetConsumptionMonthlyUsdAsync(string, string, string, int, CancellationToken)" />
    public Task<decimal?> TryGetConsumptionMonthlyUsdAsync(InfrastructureCostQueryNode node, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(node.ArmRegion) || string.IsNullOrWhiteSpace(node.SkuOrTier))
            return Task.FromResult<decimal?>(null);

        return !InfrastructureCostPricingCatalog.TryGetRetailServiceName(node.Platform, out string svc)
            ? Task.FromResult<decimal?>(null)
            : TryGetConsumptionMonthlyUsdAsync(svc, node.ArmRegion.Trim(), node.SkuOrTier.Trim(), Math.Max(1, node.Quantity),
                ct);
    }

    /// <returns>Estimated monthly USD (consumption) or <see langword="null"/> when unmatched.</returns>
    public async Task<decimal?> TryGetConsumptionMonthlyUsdAsync(
        string retailServiceName,
        string armRegionName,
        string skuName,
        int quantity,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (quantity < 1)
            quantity = 1;

        if (string.IsNullOrWhiteSpace(retailServiceName) ||
            string.IsNullOrWhiteSpace(armRegionName) ||
            string.IsNullOrWhiteSpace(skuName))
            return null;

        string skuDisplay = skuName.Trim();

        DateTimeOffset nowUtc = _clock.GetUtcNow();

        string cacheKey =
            $"{retailServiceName.ToUpperInvariant()}|{armRegionName.ToUpperInvariant()}|{skuDisplay.ToUpperInvariant()}|{quantity}";

        if (_cache.TryGetValue(cacheKey, out CachedLookup reuse) &&
            reuse.ExpiresUtc > nowUtc)
            return reuse.MonthlyUsd;

        string filter =
            $"serviceName eq '{OdataEscape(retailServiceName)}' and armRegionName eq '{OdataEscape(armRegionName.Trim())}'";

        HttpClient http = AcquireHttpClient();

        Uri? cursor = ComposeRetailRelativeUri(filter);

        decimal? best = null;

        for (int pageIdx = 0; cursor is not null && pageIdx < MaxPagesPerProbe; pageIdx++)
        {
            RetailPage? pagePayload;

            try
            {
                pagePayload =
                    await http.GetFromJsonAsync<RetailPage>(cursor, Serialization.JsonOptions.Value, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Azure Retail Prices paging request failed.");
                break;
            }

            RetailPriceDto[] rows = pagePayload?.Items ?? [];

            cursor = pagePayload?.NextLink();

            foreach (RetailPriceDto dto in rows)
            {
                if (!LooksLikeConsumptionUsd(dto))
                    continue;

                if (!string.Equals(dto.ServiceName ?? string.Empty,
                        retailServiceName,
                        StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!string.Equals((dto.ArmRegionName ?? string.Empty).Trim(),
                        armRegionName.Trim(),
                        StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!RowMatchesSku(skuDisplay, dto.SkuName))
                    continue;

                if (!TryMonthlyUsdFromRow(dto, quantity, out decimal line))
                    continue;

                best = best is null ? line : decimal.Max(best.Value, line);
            }

            if (best is not null)
                break;
        }

        decimal? answer = best is null ? null : decimal.Round(best.Value, 2);

        TimeSpan ttl = answer is null ? NegativeCacheLifetime : PositiveCacheLifetime;

        _cache[cacheKey] = new CachedLookup(answer, nowUtc.Add(ttl));

        return answer;
    }

    private HttpClient AcquireHttpClient()
        =>
            BindBase(_httpFactory() ??
                throw
                    new InvalidOperationException($"{nameof(Func<>)} resolver returned null."));

    private static HttpClient BindBase(HttpClient http)
        =>
            http.BaseAddress is null
                ?
                HintBase(http)
                :
                http;

    private static HttpClient HintBase(HttpClient http)
    {
        http.BaseAddress = Http.ArchLucidAzurePublicHttpClients.RetailPricesAuthority;

        return http;
    }
}
