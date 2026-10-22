using System.Collections.Concurrent;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Http;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Best-effort AWS Price List on-demand lookups (EC2 first) with TTL caching.</summary>
public sealed class AwsPublicPricingClient
{
    internal const double HoursPerMonthAssumption = 730d;

    private static readonly TimeSpan CacheLifetime = TimeSpan.FromHours(24);

    private readonly Func<HttpClient> _httpFactory;

    private readonly TimeProvider _clock;

    private readonly ILogger<AwsPublicPricingClient> _logger;

    private readonly ConcurrentDictionary<string, CachedLookup> _cache = new();

    public AwsPublicPricingClient(
        Func<HttpClient> httpClientFactory,
        TimeProvider clock,
        ILogger<AwsPublicPricingClient>? logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(clock);

        _httpFactory = httpClientFactory;
        _clock = clock;
        _logger = logger ?? NullLogger<AwsPublicPricingClient>.Instance;
    }

    public Task<decimal?> TryGetOnDemandMonthlyUsdAsync(InfrastructureCostQueryNode node, CancellationToken ct)
    {
        if (RuntimePlatformCloudFamily.ResolveCloudFamily(node.Platform) != CloudProvider.Aws)
            return Task.FromResult<decimal?>(null);

        if (string.IsNullOrWhiteSpace(node.ArmRegion) || string.IsNullOrWhiteSpace(node.SkuOrTier))
            return Task.FromResult<decimal?>(null);

        return node.Platform switch
        {
            RuntimePlatform.Ec2 => TryGetEc2OnDemandMonthlyUsdAsync(
                node.ArmRegion.Trim(),
                node.SkuOrTier.Trim(),
                Math.Max(1, node.Quantity),
                ct),
            _ => Task.FromResult<decimal?>(null),
        };
    }

    public async Task<decimal?> TryGetEc2OnDemandMonthlyUsdAsync(
        string regionCode,
        string instanceType,
        int quantity,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (quantity < 1)
            quantity = 1;

        if (string.IsNullOrWhiteSpace(regionCode) || string.IsNullOrWhiteSpace(instanceType))
            return null;

        string cacheKey = $"EC2|{regionCode.ToUpperInvariant()}|{instanceType.ToUpperInvariant()}|{quantity}";
        DateTimeOffset nowUtc = _clock.GetUtcNow();

        if (_cache.TryGetValue(cacheKey, out CachedLookup? reuse)
            && reuse is not null
            && reuse.ExpiresUtc > nowUtc)
        {
            return reuse.MonthlyUsd;
        }

        decimal? hourly = await TryFetchEc2HourlyUsdAsync(regionCode, instanceType, ct).ConfigureAwait(false);

        if (hourly is not { } hourlyRate || hourlyRate <= 0m)
        {
            _cache[cacheKey] = new CachedLookup(nowUtc.AddMinutes(30));
            return null;
        }

        decimal monthly = decimal.Round(decimal.Multiply(hourlyRate, (decimal)HoursPerMonthAssumption) * quantity, 2);
        _cache[cacheKey] = new CachedLookup(monthly, nowUtc.Add(CacheLifetime));

        return monthly;
    }

    private async Task<decimal?> TryFetchEc2HourlyUsdAsync(string regionCode, string instanceType, CancellationToken ct)
    {
        HttpClient http = _httpFactory();

        if (http.BaseAddress is null)
            http.BaseAddress = ArchLucidMultiCloudPublicHttpClients.AwsPricingAuthority;

        Uri requestUri = new(
            $"offers/v1.0/aws/AmazonEC2/current/{regionCode.Trim()}/index.json",
            UriKind.Relative);

        try
        {
            string json = await http.GetStringAsync(requestUri, ct).ConfigureAwait(false);

            return AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd(json, instanceType);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // codeql[cs/cleartext-storage-of-sensitive-information]: public AWS Price List JSON probe; region/instance sanitized; exception for structured telemetry only (docs/library/CODEQL_TRIAGE.md).
            _logger.LogDebugAwsPricingProbeFailed(ex, regionCode, instanceType);
            return null;
        }
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
