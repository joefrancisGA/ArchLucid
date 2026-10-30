using System.Globalization;

namespace ArchLucid.Application.Pilots;

internal static class BoardPackPdfCoverCopy
{
    internal static bool UsesCustomPeriod(DateTimeOffset? overrideStartUtc, DateTimeOffset? overrideEndUtc) =>
        overrideStartUtc is not null && overrideEndUtc is not null;

    internal static string BuildTitle(
        int year,
        int quarter,
        DateTimeOffset periodStartUtc,
        DateTimeOffset periodEndUtc,
        bool customPeriod)
    {
        if (customPeriod)
        {
            return FormattableString.Invariant(
                $"# ArchLucid board pack — custom period `{FormatUtc(periodStartUtc)}` inclusive → `{FormatUtc(periodEndUtc)}` exclusive (UTC)");
        }

        return FormattableString.Invariant(
            $"# ArchLucid board pack — Q{quarter} {year} (UTC)");
    }

    internal static string BuildIntroParagraph(bool customPeriod)
    {
        if (customPeriod)
        {
            return """
                   This pack combines the **weekly sponsor digest pipeline** (one representative ISO week inside the requested period) with the **tenant value-report metrics** for that same UTC window. Figures come only from existing builders — no ad-hoc ROI math.
                   """;
        }

        return """
               This pack combines the **weekly sponsor digest pipeline** (one representative ISO week inside the quarter) with the **tenant value-report metrics** for the full quarter window. Figures come only from existing builders — no ad-hoc ROI math.
               """;
    }

    private static string FormatUtc(DateTimeOffset value) =>
        value.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
}
