using System.Globalization;

namespace ArchLucid.Core.Pagination;

/// <summary>UTC round-trip helpers shared by opaque pagination cursors that embed ISO-8601 timestamps.</summary>
internal static class UtcCursorDateTimeCodec
{
    public static string FormatRoundTripUtc(DateTime dateTime) =>
        DateTime.SpecifyKind(dateTime, DateTimeKind.Utc).ToString("o");

    public static DateTime NormalizeToUtc(DateTime dateTime) =>
        dateTime.Kind is DateTimeKind.Utc
            ? dateTime
            : DateTime.SpecifyKind(dateTime.ToUniversalTime(), DateTimeKind.Utc);

    public static bool TryParseRoundTripUtc(string? value, out DateTime utc)
    {
        utc = default;

        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (!DateTime.TryParse(value, null, DateTimeStyles.RoundtripKind, out DateTime parsed))
            return false;

        utc = NormalizeToUtc(parsed);
        return true;
    }
}
