using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
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
