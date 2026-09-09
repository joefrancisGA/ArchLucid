namespace ArchLucid.Application.Architecture;

/// <summary>
///     TB-645 estate-gap honesty when no Azure inventory snapshot is bound to the architecture (AS-051).
/// </summary>
public static class ArchitectureInventoryEstateGapCopy
{
    public const string UnboundEstateGapLine =
        "No inventory snapshot bound — estate not in this review.";

    public const string CareerExportHeading = "Inventory estate";

    public static string? FormatUnboundLine(bool? architectureInventoryBound)
    {
        if (architectureInventoryBound != false)
        {
            return null;
        }

        return UnboundEstateGapLine;
    }

    public static string FormatCareerExportMarkdown(bool? architectureInventoryBound)
    {
        string? line = FormatUnboundLine(architectureInventoryBound);

        if (line is null)
        {
            return string.Empty;
        }

        return $"## {CareerExportHeading}\n\n{line}\n";
    }
}
