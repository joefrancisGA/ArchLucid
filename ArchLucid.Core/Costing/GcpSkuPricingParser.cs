using System.Text.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    public static bool TryReadHourlyUsdFromSku(JsonElement sku, string machineType, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!TryGetPropertyCaseInsensitive(sku, "description", out JsonElement descriptionElement))
            return false;

        string? description = descriptionElement.GetString();

        if (string.IsNullOrWhiteSpace(description)
            || !DescriptionMatchesMachineType(description, machineType))
        {
            return false;
        }

        if (!TryGetPropertyCaseInsensitive(sku, "pricingInfo", out JsonElement pricingInfo)
            || pricingInfo.GetArrayLength() == 0)
        {
            return false;
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

            hourlyUsd = hourly;

            return true;
        }

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
}
