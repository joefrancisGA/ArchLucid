using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    public static bool TryReadHourlyUsdFromSku(JsonElement sku, string machineType, string? regionCode, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(sku, "description", out JsonElement descriptionElement)
            || descriptionElement.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        string? description = descriptionElement.GetString();

        if (string.IsNullOrWhiteSpace(description)
            || IsPreemptibleDescription(description)
            || !DescriptionMatchesMachineType(description, machineType)
            || !DescriptionMatchesRegion(description, regionCode))
        {
            return false;
        }

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(sku, "pricingInfo", out JsonElement pricingInfo)
            || pricingInfo.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement pricingEntry in pricingInfo.EnumerateArray())
        {
            if (!JsonObjectPropertyLookup.TryGetIgnoreCase(pricingEntry, "pricingExpression", out JsonElement expression))
                continue;

            if (!JsonObjectPropertyLookup.TryGetIgnoreCase(expression, "usageUnit", out JsonElement usageUnit)
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
}
