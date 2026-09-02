using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Costing;

/// <summary>Parses AWS Price List EC2 regional offer index JSON for OnDemand hourly USD rates.</summary>
public static class AwsEc2OfferIndexParser
{
    internal static decimal? TryGetLinuxOnDemandHourlyUsd(string offerJson, string instanceType)
    {
        if (string.IsNullOrWhiteSpace(offerJson) || string.IsNullOrWhiteSpace(instanceType))
            return null;

        using JsonDocument document = JsonDocument.Parse(offerJson);

        if (!document.RootElement.TryGetProperty("products", out JsonElement products))
            return null;

        if (!document.RootElement.TryGetProperty("terms", out JsonElement terms))
            return null;

        if (!terms.TryGetProperty("OnDemand", out JsonElement onDemandRoot))
            return null;

        string normalizedInstance = instanceType.Trim();

        foreach (JsonProperty productEntry in products.EnumerateObject())
        {
            JsonElement product = productEntry.Value;

            if (!product.TryGetProperty("attributes", out JsonElement attributes))
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

            if (!onDemandRoot.TryGetProperty(productEntry.Name, out JsonElement skuTerms))
                continue;

            foreach (JsonProperty skuTerm in skuTerms.EnumerateObject())
            {
                if (!skuTerm.Value.TryGetProperty("priceDimensions", out JsonElement dimensions))
                    continue;

                foreach (JsonProperty dimension in dimensions.EnumerateObject())
                {
                    if (!dimension.Value.TryGetProperty("unit", out JsonElement unitElement))
                        continue;

                    if (!TryReadHourlyUnit(unitElement))
                        continue;

                    if (!dimension.Value.TryGetProperty("pricePerUnit", out JsonElement pricePerUnit))
                        continue;

                    if (!pricePerUnit.TryGetProperty("USD", out JsonElement usdElement))
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
                hourlyUsd = (decimal)numeric;

                return hourlyUsd > 0m;
            }

            return false;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            hourlyUsd = element.ValueKind == JsonValueKind.True ? 1m : 0m;

            return hourlyUsd > 0m;
        }

        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        if (TryParseBooleanString(raw, out bool boolean))
        {
            hourlyUsd = boolean ? 1m : 0m;

            return hourlyUsd > 0m;
        }

        return decimal.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out hourlyUsd)
            && hourlyUsd > 0m;
    }

    private static bool TryReadHourlyUnit(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        return string.Equals(raw?.Trim(), "Hrs", StringComparison.OrdinalIgnoreCase);
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

    private static bool TryReadAttribute(JsonElement attributes, string name, out string? value)
    {
        value = null;

        if (!attributes.TryGetProperty(name, out JsonElement element))
            return false;

        if (element.ValueKind is not JsonValueKind.String)
            return false;

        value = element.GetString();

        return !string.IsNullOrWhiteSpace(value);
    }
}
