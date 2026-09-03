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

    private readonly GcpCatalogHttpClient _catalogHttpClient;

    private readonly IOptionsMonitor<GcpBillingCatalogOptions> _options;

    private readonly TimeProvider _clock;

    private readonly GcpSkuCache _skuCache = new();

    public GcpCloudBillingCatalogClient(
        Func<HttpClient> httpClientFactory,
        IOptionsMonitor<GcpBillingCatalogOptions> options,
        TimeProvider clock,
        ILogger<GcpCloudBillingCatalogClient>? logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(clock);

        ILogger<GcpCloudBillingCatalogClient> effectiveLogger =
            logger ?? NullLogger<GcpCloudBillingCatalogClient>.Instance;

        _catalogHttpClient = new GcpCatalogHttpClient(httpClientFactory, effectiveLogger);
        _options = options;
        _clock = clock;
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

        if (_skuCache.TryGetFresh(cacheKey, nowUtc, out decimal? cachedMonthly))
            return cachedMonthly;

        decimal? hourly = await _catalogHttpClient.TryFetchComputeHourlyUsdAsync(apiKey, machineType, ct).ConfigureAwait(false);

        if (hourly is not { } hourlyRate || hourlyRate <= 0m)
        {
            _skuCache.RememberMiss(cacheKey, nowUtc);
            return null;
        }

        decimal monthly = decimal.Round(decimal.Multiply(hourlyRate, (decimal)HoursPerMonthAssumption) * quantity, 2);
        _skuCache.RememberHit(cacheKey, monthly, nowUtc);

        return monthly;
    }
}
