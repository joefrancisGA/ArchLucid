using System.Globalization;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Honest stale-snapshot copy for bound inventory (AS-052). Warns; does not imply live collection.
/// </summary>
public static class ArchitectureInventorySnapshotFreshnessCopy
{
    public const string CareerExportHeading = "Inventory freshness";

    public const string StaleLinePrefix = "Bound snapshot captured";

    public const string StaleLineSuffix = "— may not reflect current estate.";

    public static string FormatStaleLine(DateTime capturedUtc)
    {
        DateTime utc = capturedUtc.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(capturedUtc, DateTimeKind.Utc)
            : capturedUtc.ToUniversalTime();

        string date = utc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        return $"{StaleLinePrefix} {date} {StaleLineSuffix}";
    }

    public static string? FormatStaleLineIfStale(DateTime? capturedUtc, DateTime utcNow)
    {
        if (!ArchitectureInventorySnapshotFreshness.IsStale(capturedUtc, utcNow))
        {
            return null;
        }

        return FormatStaleLine(capturedUtc!.Value);
    }

    public static string FormatCareerExportMarkdown(DateTime? capturedUtc, DateTime utcNow)
    {
        string? line = FormatStaleLineIfStale(capturedUtc, utcNow);

        if (line is null)
        {
            return string.Empty;
        }

        return $"## {CareerExportHeading}\n\n{line}\n";
    }
}
