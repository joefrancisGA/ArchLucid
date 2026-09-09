using System.Text.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
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
        if (element.ValueKind != JsonValueKind.String)
            return false;

        string? raw = element.GetString();

        string? trimmed = raw?.Trim();

        return string.Equals(trimmed, "h", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "Hrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hr", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hour", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "hours", StringComparison.OrdinalIgnoreCase);
    }
}
