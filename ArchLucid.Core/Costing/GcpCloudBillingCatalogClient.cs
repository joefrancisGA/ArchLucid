using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Costing;

/// <summary>Best-effort GCP Cloud Billing Catalog SKU probes with optional API key.</summary>
public sealed class GcpCloudBillingCatalogClient
{
    internal const double HoursPerMonthAssumption = 730d;

    private const string ComputeEngineServiceId = "6F81-5844-456A";

    private static readonly TimeSpan CacheLifetime = TimeSpan.FromHours(24);

    private readonly Func<HttpClient> _httpFactory;

    private readonly IOptionsMonitor<GcpBillingCatalogOptions> _options;

    private readonly TimeProvider _clock;

    private readonly ILogger<GcpCloudBillingCatalogClient> _logger;

    private readonly ConcurrentDictionary<string, CachedLookup> _cache = new();

    public GcpCloudBillingCatalogClient(
        Func<HttpClient> httpClientFactory,
        IOptionsMonitor<GcpBillingCatalogOptions> options,
        TimeProvider clock,
        ILogger<GcpCloudBillingCatalogClient>? logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(clock);

        _httpFactory = httpClientFactory;
        _options = options;
        _clock = clock;
        _logger = logger ?? NullLogger<GcpCloudBillingCatalogClient>.Instance;
    }

    public Task<decimal?> TryGetCatalogMonthlyUsdAsync(InfrastructureCostQueryNode node, CancellationToken ct)
    {
        if (RuntimePlatformCloudFamily.ResolveCloudFamily(node.Platform) != CloudProvider.Gcp)
            return Task.FromResult<decimal?>(null);

        if (string.IsNullOrWhiteSpace(node.SkuOrTier))
            return Task.FromResult<decimal?>(null);

        return node.Platform switch
        {
            RuntimePlatform.ComputeEngine => TryGetComputeEngineMonthlyUsdAsync(
                node.SkuOrTier.Trim(),
                Math.Max(1, node.Quantity),
                ct),
            _ => Task.FromResult<decimal?>(null),
        };
    }

    public async Task<decimal?> TryGetComputeEngineMonthlyUsdAsync(
        string machineType,
        int quantity,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        string? apiKey = _options.CurrentValue.ApiKey?.Trim();

        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        if (quantity < 1)
            quantity = 1;

        string cacheKey = $"GCE|{machineType.ToUpperInvariant()}|{quantity}";
        DateTimeOffset nowUtc = _clock.GetUtcNow();

        if (_cache.TryGetValue(cacheKey, out CachedLookup? reuse)
            && reuse is not null
            && reuse.ExpiresUtc > nowUtc)
        {
            return reuse.MonthlyUsd;
        }

        decimal? hourly = await TryFetchComputeHourlyUsdAsync(apiKey, machineType, ct).ConfigureAwait(false);

        if (hourly is not { } hourlyRate || hourlyRate <= 0m)
        {
            _cache[cacheKey] = new CachedLookup(nowUtc.AddMinutes(30));
            return null;
        }

        decimal monthly = decimal.Round(decimal.Multiply(hourlyRate, (decimal)HoursPerMonthAssumption) * quantity, 2);
        _cache[cacheKey] = new CachedLookup(monthly, nowUtc.Add(CacheLifetime));

        return monthly;
    }

    private async Task<decimal?> TryFetchComputeHourlyUsdAsync(string apiKey, string machineType, CancellationToken ct)
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

            if (!document.RootElement.TryGetProperty("skus", out JsonElement skus))
                return null;

            string needle = machineType.Trim();

            foreach (JsonElement sku in skus.EnumerateArray())
            {
                if (!sku.TryGetProperty("description", out JsonElement descriptionElement))
                    continue;

                string? description = descriptionElement.GetString();

                if (string.IsNullOrWhiteSpace(description)
                    || !description.Contains(needle, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!sku.TryGetProperty("pricingInfo", out JsonElement pricingInfo)
                    || pricingInfo.GetArrayLength() == 0)
                {
                    continue;
                }

                JsonElement firstPricing = pricingInfo[0];

                if (!firstPricing.TryGetProperty("pricingExpression", out JsonElement expression))
                    continue;

                if (!expression.TryGetProperty("usageUnit", out JsonElement usageUnit)
                    || !string.Equals(usageUnit.GetString(), "h", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!TryReadTieredRateUsd(firstPricing, out decimal hourly))
                    continue;

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

    private static bool TryReadTieredRateUsd(JsonElement pricingInfo, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!pricingInfo.TryGetProperty("pricingExpression", out JsonElement expression))
            return false;

        if (!expression.TryGetProperty("tieredRates", out JsonElement tieredRates)
            || tieredRates.GetArrayLength() == 0)
        {
            return false;
        }

        JsonElement firstTier = tieredRates[0];

        if (!firstTier.TryGetProperty("unitPrice", out JsonElement unitPrice))
            return false;

        if (!unitPrice.TryGetProperty("units", out JsonElement unitsElement))
            return false;

        if (!unitPrice.TryGetProperty("nanos", out JsonElement nanosElement))
            return false;

        if (!long.TryParse(unitsElement.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long units))
            units = 0;

        if (!int.TryParse(nanosElement.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int nanos))
            nanos = 0;

        hourlyUsd = units + nanos / 1_000_000_000m;

        return hourlyUsd > 0m;
    }

    private sealed record CachedLookup
    {
        public CachedLookup(DateTimeOffset expiresUtc)
        {
            ExpiresUtc = expiresUtc;
        }

        public CachedLookup(decimal monthlyUsd, DateTimeOffset expiresUtc)
        {
            MonthlyUsd = monthlyUsd;
            ExpiresUtc = expiresUtc;
        }

        public decimal? MonthlyUsd
        {
            get;
        }

        public DateTimeOffset ExpiresUtc
        {
            get;
        }
    }
}
