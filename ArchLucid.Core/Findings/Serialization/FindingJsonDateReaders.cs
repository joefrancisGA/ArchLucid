using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Findings.Serialization;

internal static class FindingJsonDateReaders
{
    internal static bool TryReadReviewedAtUtc(JsonElement element, out DateTimeOffset value)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (!string.IsNullOrWhiteSpace(raw)
                && DateTimeOffset.TryParse(
                    raw,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.RoundtripKind,
                    out value))
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long unixMilliseconds))
            {
                value = DateTimeOffset.FromUnixTimeMilliseconds(unixMilliseconds);

                return true;
            }

            value = default;

            return false;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numericUnixMilliseconds))
        {
            value = DateTimeOffset.FromUnixTimeMilliseconds(numericUnixMilliseconds);

            return true;
        }

        value = default;

        return false;
    }
}
