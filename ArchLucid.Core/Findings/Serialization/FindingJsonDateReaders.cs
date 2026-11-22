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
                    DateTimeStyles.AssumeUniversal,
                    out value))
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(raw)
                && long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long unixMilliseconds))
            {
                return TryFromUnixMilliseconds(unixMilliseconds, out value);
            }

            value = default;

            return false;
        }

        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt64(out long numericUnixMilliseconds))
        {
            return TryFromUnixMilliseconds(numericUnixMilliseconds, out value);
        }

        value = default;

        return false;
    }
    // Untrusted external timestamps must never escape the TryRead contract as an
    // ArgumentOutOfRangeException. Both numeric and string paths share this guard.
    private static bool TryFromUnixMilliseconds(long milliseconds, out DateTimeOffset value)
    {
        if (milliseconds < DateTimeOffset.MinValue.ToUnixTimeMilliseconds()
            || milliseconds > DateTimeOffset.MaxValue.ToUnixTimeMilliseconds())
        {
            value = default;
            return false;
        }

        value = DateTimeOffset.FromUnixTimeMilliseconds(milliseconds);
        return true;
    }
}
