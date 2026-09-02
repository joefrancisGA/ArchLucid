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

            if (!TryGetPropertyCaseInsensitive(document.RootElement, "skus", out JsonElement skus))
                return null;

            string needle = machineType.Trim();

            foreach (JsonElement sku in skus.EnumerateArray())
            {
                if (!TryGetPropertyCaseInsensitive(sku, "description", out JsonElement descriptionElement))
                    continue;

                string? description = descriptionElement.GetString();

                if (string.IsNullOrWhiteSpace(description)
                    || !description.Contains(needle, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!TryGetPropertyCaseInsensitive(sku, "pricingInfo", out JsonElement pricingInfo)
                    || pricingInfo.GetArrayLength() == 0)
                {
                    continue;
                }

                foreach (JsonElement pricingEntry in pricingInfo.EnumerateArray())
                {
                    if (!TryGetPropertyCaseInsensitive(pricingEntry, "pricingExpression", out JsonElement expression))
                        continue;

                    if (!TryGetPropertyCaseInsensitive(expression, "usageUnit", out JsonElement usageUnit)
                        || !IsHourlyUsageUnit(usageUnit))
                    {
                        continue;
                    }

                    if (!TryReadTieredRateUsd(pricingEntry, out decimal hourly))
                        continue;

                    return hourly;
                }
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

        if (!TryGetPropertyCaseInsensitive(pricingInfo, "pricingExpression", out JsonElement expression))
            return false;

        if (!TryGetPropertyCaseInsensitive(expression, "tieredRates", out JsonElement tieredRates)
            || tieredRates.GetArrayLength() == 0)
        {
            return false;
        }

        foreach (JsonElement tier in tieredRates.EnumerateArray())
        {
            if (!TryGetPropertyCaseInsensitive(tier, "unitPrice", out JsonElement unitPrice))
                continue;

            long units = 0;

            if (TryGetPropertyCaseInsensitive(unitPrice, "units", out JsonElement unitsElement)
                && !TryReadInt64Token(unitsElement, out units))
            {
                units = 0;
            }

            int nanos = 0;

            if (TryGetPropertyCaseInsensitive(unitPrice, "nanos", out JsonElement nanosElement)
                && !TryReadInt32Token(nanosElement, out nanos))
            {
                nanos = 0;
            }

            hourlyUsd = units + nanos / 1_000_000_000m;

            if (hourlyUsd > 0m)
                return true;
        }

        hourlyUsd = 0m;

        return false;
    }

    private static bool IsHourlyUsageUnit(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
            return element.ValueKind == JsonValueKind.True;

        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        if (TryParseBooleanString(raw, out bool boolean))
            return boolean;

        string? trimmed = raw?.Trim();

        return string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "Hrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hour", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hours", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryReadInt64Token(JsonElement element, out long value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out value))
            return true;

        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberDouble(element, out double numeric)
            && numeric <= long.MaxValue)
        {
            value = (long)numeric;

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.ValueKind == JsonValueKind.True ? 1L : 0L;

            return true;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            value = default;

            return false;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        if (TryParseBooleanString(raw, out bool boolean))
        {
            value = boolean ? 1L : 0L;

            return true;
        }

        if (long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return TryParseWholeNumberString(raw.Trim(), out value);
    }

    private static bool TryReadInt32Token(JsonElement element, out int value)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out value))
            return true;

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetInt64(out long wholeNumber)
            && wholeNumber >= int.MinValue
            && wholeNumber <= int.MaxValue)
        {
            value = (int)wholeNumber;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Number
            && TryReadWholeNumberDouble(element, out double numeric)
            && numeric >= int.MinValue
            && numeric <= int.MaxValue)
        {
            value = (int)numeric;

            return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            value = element.ValueKind == JsonValueKind.True ? 1 : 0;

            return true;
        }

        if (element.ValueKind != JsonValueKind.String)
        {
            value = default;

            return false;
        }

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        if (TryParseBooleanString(raw, out bool boolean))
        {
            value = boolean ? 1 : 0;

            return true;
        }

        if (int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return TryParseWholeNumberString(raw.Trim(), out value);
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryReadWholeNumberDouble(JsonElement element, out double value)
    {
        value = default;

        if (element.ValueKind != JsonValueKind.Number || !element.TryGetDouble(out value))
            return false;

        return double.IsFinite(value) && value >= 0 && value == Math.Floor(value);
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= int.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out long value)
    {
        if (long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric <= long.MaxValue
            && numeric == Math.Floor(numeric))
        {
            value = (long)numeric;

            return true;
        }

        value = default;

        return false;
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
