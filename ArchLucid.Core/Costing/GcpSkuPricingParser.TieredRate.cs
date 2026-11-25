using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Costing;

internal static partial class GcpSkuPricingParser
{
    private static bool TryReadTieredRateUsd(JsonElement pricingInfo, out decimal hourlyUsd)
    {
        hourlyUsd = 0m;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(pricingInfo, "pricingExpression", out JsonElement expression))
            return false;

        if (!JsonObjectPropertyLookup.TryGetIgnoreCase(expression, "tieredRates", out JsonElement tieredRates)
            || tieredRates.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement tier in tieredRates.EnumerateArray())
        {
            if (!JsonObjectPropertyLookup.TryGetIgnoreCase(tier, "unitPrice", out JsonElement unitPrice)
                || unitPrice.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            // An omitted zero component is valid; a present value that cannot be read is not zero.
            long units = 0;

            if (JsonObjectPropertyLookup.TryGetIgnoreCase(unitPrice, "units", out JsonElement unitsElement)
                && !TryReadInt64Token(unitsElement, out units))
            {
                continue;
            }

            int nanos = 0;

            if (JsonObjectPropertyLookup.TryGetIgnoreCase(unitPrice, "nanos", out JsonElement nanosElement)
                && !TryReadInt32Token(nanosElement, out nanos))
            {
                continue;
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
