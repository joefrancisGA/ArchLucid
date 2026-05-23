using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

using Microsoft.Extensions.Logging;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Costing;

/// <summary>Best-effort Azure Retail Prices (consumption) lookups with paging and TTL caching.</summary>
public sealed class AzureRetailPricesCatalogClient
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



    internal static Uri ComposeRetailRelativeUri(string filterClause)
        =>
            new(


                $"{RetailPriceQueries.RetailPricesRelativePath}?{RetailPriceQueries.FilterParameter}={Uri.EscapeDataString(filterClause)}",
                UriKind.Relative);



    internal static bool RowMatchesSku(string armSkuHint, string? retailSkuPricing) =>
        RowMatchesCollapsed(CollapseComparableSku(armSkuHint), CollapseComparableSku(retailSkuPricing));


    internal static bool RowMatchesCollapsed(string targetCollapsed, string retailCollapsed)
    {

        if (targetCollapsed.Length == 0 || retailCollapsed.Length == 0)

            return false;

        return string.Equals(retailCollapsed,

                targetCollapsed,
                StringComparison.OrdinalIgnoreCase)
               ||

               retailCollapsed.StartsWith(targetCollapsed, StringComparison.OrdinalIgnoreCase) ||

               targetCollapsed.StartsWith(retailCollapsed, StringComparison.OrdinalIgnoreCase) ||

               (targetCollapsed.Length > 4 && retailCollapsed.Contains(targetCollapsed,

                   StringComparison.OrdinalIgnoreCase));


    }



    internal static string CollapseComparableSku(string? value)
    {


        if (string.IsNullOrWhiteSpace(value))

            return string.Empty;


        return Regex.Replace(value.Trim(),
            @"[\s_]+",

            string.Empty,
            RegexOptions.None,
            TimeSpan.FromSeconds(1));


    }



    internal static bool LooksLikeConsumptionUsd(RetailPriceDto row)


    {


        if (!string.Equals(row.CurrencyCode ?? string.Empty,


                "USD",
                StringComparison.OrdinalIgnoreCase))

            return false;

        if ((row.Type ?? string.Empty)


                .

                Contains("Reservation",


                    StringComparison.OrdinalIgnoreCase))

            return false;

        if ((row.MeterTier ?? string.Empty).Contains("Government",

                StringComparison.OrdinalIgnoreCase))


            return false;

        string meterName = row.MeterName ?? string.Empty;


        if (meterName.Contains("Rsv", StringComparison.OrdinalIgnoreCase))


            return false;

        string meter = row.UnitOfMeasure ?? string.Empty;


        return AzureRetailPricesCatalogClient.IsHourMeter(meter) ||

               AzureRetailPricesCatalogClient.IsMonthlyMeter(meter);

    }



    internal static bool TryMonthlyUsdFromRow(RetailPriceDto dto, int quantity, out decimal monthly)


    {


        decimal unit =
            PreferUnit(dto);



        monthly = 0;



        if (unit <= 0m)


            return false;

        string raw = dto.UnitOfMeasure ?? string.Empty;

        if (IsHourMeter(raw))
        {


            decimal perResource = decimal.Multiply(unit,


                (decimal)HoursPerMonthAssumption);



            monthly = decimal.Multiply(perResource, quantity);

            return true;

        }

        if (!IsMonthlyMeter(raw))
            return false;
        monthly = decimal.Multiply(unit, quantity);


        return true;



    }



    internal static decimal PreferUnit(RetailPriceDto dto)
        =>
            dto.UnitPrice is { } up and > 0 ?
                up
                :

                dto.RetailPrice ?? 0m;



    internal static bool IsHourMeter(string uom)


        =>


            uom.Contains("Hour", StringComparison.OrdinalIgnoreCase)


            ||

            uom.Contains("hrs", StringComparison.OrdinalIgnoreCase);



    internal static bool IsMonthlyMeter(string uom)


        =>


            uom.Contains("Month",

                StringComparison.OrdinalIgnoreCase)


            ||

            uom.Contains("/Month", StringComparison.OrdinalIgnoreCase);



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



    internal static string OdataEscape(string literal)
        =>
            literal.Replace("'",
                "''",


                StringComparison.Ordinal);



    internal static class Serialization


    {


        internal static readonly Lazy<JsonSerializerOptions> JsonOptions = new(CreateJson);



        internal static JsonSerializerOptions CreateJson() =>
            new()


            {


                PropertyNameCaseInsensitive = true,

                NumberHandling = JsonNumberHandling.AllowReadingFromString,
            };


    }



    private readonly record struct CachedLookup(decimal? MonthlyUsd, DateTimeOffset ExpiresUtc);



    private sealed record RetailPage


    {


        public RetailPriceDto[]? Items

        {


            get;

            init;

        }



        [JsonPropertyName("NextPageLink")]
        public string? NextPageLinkAbsolute


        {


            get;

            init;

        }



        internal Uri? NextLink()
            =>



                string.IsNullOrWhiteSpace(NextPageLinkAbsolute)

                    ?
                    null
                    :

                    new Uri(NextPageLinkAbsolute, UriKind.Absolute);


    }



    internal sealed record RetailPriceDto


    {


        public string? CurrencyCode


        {


            get;

            init;

        }



        public decimal? UnitPrice

        {


            get;

            init;



        }



        public decimal? RetailPrice

        {


            get;


            init;


        }



        public string? UnitOfMeasure

        {


            get;


            init;



        }



        public string? SkuName

        {


            get;


            init;



        }



        public string? ServiceName

        {


            get;


            init;



        }



        public string? ArmRegionName


        {


            get;



            init;


        }



        public string? MeterTier

        {


            get;



            init;


        }



        public string? MeterName

        {


            get;



            init;


        }



        public string? Type


        {


            get;


            init;


        }



    }



}
