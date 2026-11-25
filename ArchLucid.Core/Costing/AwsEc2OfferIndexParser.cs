using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Costing;

/// <summary>Parses AWS Price List EC2 regional offer index JSON for OnDemand hourly USD rates.</summary>
public static class AwsEc2OfferIndexParser
{
    internal static decimal? TryGetLinuxOnDemandHourlyUsd(string offerJson, string instanceType)
    {
        if (string.IsNullOrWhiteSpace(offerJson) || string.IsNullOrWhiteSpace(instanceType))
            return null;

        using JsonDocument document = JsonDocument.Parse(offerJson);

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(document.RootElement, "products", out JsonElement products)
            || products.ValueKind != JsonValueKind.Object)
            return null;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(document.RootElement, "terms", out JsonElement terms))
            return null;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(terms, "OnDemand", out JsonElement onDemandRoot)
            || onDemandRoot.ValueKind != JsonValueKind.Object)
            return null;

        string normalizedInstance = instanceType.Trim();

        foreach (JsonProperty productEntry in products.EnumerateObject())
        {
            JsonElement product = productEntry.Value;

            if (!JsonObjectPropertyLookup.TryGetIgnoreCase(product, "attributes", out JsonElement attributes))
                continue;

            if (!TryReadAttribute(attributes, "instanceType", out string? foundType)
                || !string.Equals(foundType, normalizedInstance, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadAttribute(attributes, "operatingSystem", out string? os)
                || !string.Equals(os, "Linux", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadAttribute(attributes, "tenancy", out string? tenancy)
                || !string.Equals(tenancy, "Shared", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadAttribute(attributes, "preInstalledSw", out string? preInstalled)
                || !string.Equals(preInstalled, "NA", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!JsonObjectPropertyLookup.TryGetIgnoreCase(onDemandRoot, productEntry.Name, out JsonElement skuTerms)
                || skuTerms.ValueKind != JsonValueKind.Object)
                continue;

            foreach (JsonProperty skuTerm in skuTerms.EnumerateObject())
            {
                if (!JsonObjectPropertyLookup.TryGetIgnoreCase(skuTerm.Value, "priceDimensions", out JsonElement dimensions)
                    || dimensions.ValueKind != JsonValueKind.Object)
                    continue;

                foreach (JsonProperty dimension in dimensions.EnumerateObject())
                {
                    if (!JsonObjectPropertyLookup.TryGetIgnoreCase(dimension.Value, "unit", out JsonElement unitElement))
                        continue;

                    if (!TryReadHourlyUnit(unitElement))
                        continue;

                    if (!JsonObjectPropertyLookup.TryGetIgnoreCase(dimension.Value, "pricePerUnit", out JsonElement pricePerUnit))
                        continue;

                    if (!JsonObjectPropertyLookup.TryGetIgnoreCase(pricePerUnit, "USD", out JsonElement usdElement))
                        continue;

                    if (TryReadUsdPrice(usdElement, out decimal hourly))
                        return hourly;
                }
            }
        }

        return null;
    }

    private static bool TryReadUsdPrice(JsonElement element, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (element.ValueKind == JsonValueKind.Number)
        {
            if (element.TryGetDecimal(out hourlyUsd))
                return hourlyUsd > 0m;

            if (element.TryGetDouble(out double numeric)
                && double.IsFinite(numeric)
                && numeric > 0)
            {
                try
                {
                    hourlyUsd = (decimal)numeric;
                }
                catch (OverflowException)
                {
                    return false;
                }

                return hourlyUsd > 0m;
            }

            return false;
        }

        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        return decimal.TryParse(raw.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out hourlyUsd)
            && hourlyUsd > 0m;
    }

    private static bool TryReadHourlyUnit(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        string? trimmed = raw?.Trim();

        return string.Equals(trimmed, "Hrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hour", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hours", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryReadAttribute(JsonElement attributes, string name, out string? value)
    {
        value = null;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(attributes, name, out JsonElement element))
            return false;

        if (element.ValueKind == JsonValueKind.Number)
        {
            value = TryReadWholeNumberLongToken(element) ?? element.GetRawText().Trim();

            return !string.IsNullOrWhiteSpace(value);
        }

        if (element.ValueKind is not JsonValueKind.String)
            return false;

        value = element.GetString()?.Trim();

        return !string.IsNullOrWhiteSpace(value);
    }

    private static string? TryReadWholeNumberLongToken(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long whole))
            return whole.ToString(CultureInfo.InvariantCulture);

        if (element.ValueKind == JsonValueKind.Number
            && element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= long.MinValue
            && numeric <= long.MaxValue
            && numeric == Math.Floor(numeric))
        {
            return ((long)numeric).ToString(CultureInfo.InvariantCulture);
        }

        return null;
    }
}
