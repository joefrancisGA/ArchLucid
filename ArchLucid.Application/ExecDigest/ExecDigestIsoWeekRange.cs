using System.Globalization;

namespace ArchLucid.Application.ExecDigest;

/// <summary>Parses digest ISO-week idempotency keys into UTC week windows.</summary>
public static class ExecDigestIsoWeekRange
{
    public static (DateTime WeekStartUtcInclusive, DateTime WeekEndUtcExclusive) Parse(string isoWeekKey)
    {
        if (string.IsNullOrWhiteSpace(isoWeekKey))
            throw new ArgumentException("ISO week key is required.", nameof(isoWeekKey));

        string trimmed = isoWeekKey.Trim();
        int separatorIndex = trimmed.LastIndexOf("-W", StringComparison.Ordinal);
        if (separatorIndex <= 0 || separatorIndex + 2 >= trimmed.Length)
            throw new FormatException($"ISO week key '{trimmed}' is not in yyyy-Www format.");

        if (!int.TryParse(trimmed[..separatorIndex], NumberStyles.None, CultureInfo.InvariantCulture, out int isoYear))
            throw new FormatException($"ISO week key '{trimmed}' has an invalid year.");

        if (!int.TryParse(trimmed[(separatorIndex + 2)..], NumberStyles.None, CultureInfo.InvariantCulture, out int isoWeek))
            throw new FormatException($"ISO week key '{trimmed}' has an invalid week.");

        DateTime weekStartUtc = DateTime.SpecifyKind(ISOWeek.ToDateTime(isoYear, isoWeek, DayOfWeek.Monday), DateTimeKind.Utc);
        return (weekStartUtc, weekStartUtc.AddDays(7));
    }
}
