using System.Globalization;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     AS-063: decision-grade semantic support band counts for sponsor/first-value artifacts (mirrors AS-062 stamp).
/// </summary>
public static class FirstValueReportSemanticSupportBandSummary
{
    public sealed record SemanticSupportBandStampCounts(
        int Supported,
        int Unchecked,
        int Unsupported,
        int NotScored,
        int DecisionGradeTotal);

    public sealed record UnsupportedSemanticSupportStampEntry(string FindingId, string Title);

    public static SemanticSupportBandStampCounts CountDecisionGradeSemanticSupportBands(
        IReadOnlyList<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        int supported = 0;
        int uncheckedCount = 0;
        int unsupported = 0;
        int notScored = 0;
        int decisionGradeTotal = 0;

        foreach (ArchitectureFinding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            decisionGradeTotal++;
            FindingSemanticSupportBand band = ResolveDecisionGradeSemanticSupportBand(finding.SemanticSupportBand);

            switch (band)
            {
                case FindingSemanticSupportBand.Supported:
                    supported++;
                    break;
                case FindingSemanticSupportBand.Unchecked:
                    uncheckedCount++;
                    break;
                case FindingSemanticSupportBand.Unsupported:
                    unsupported++;
                    break;
                default:
                    notScored++;
                    break;
            }
        }

        return new SemanticSupportBandStampCounts(
            supported,
            uncheckedCount,
            unsupported,
            notScored,
            decisionGradeTotal);
    }

    public static FindingSemanticSupportBand ResolveDecisionGradeSemanticSupportBand(
        FindingSemanticSupportBand? raw)
    {
        return raw ?? FindingSemanticSupportBand.NotScored;
    }

    public static bool StampSemanticSupportShowsAllClear(SemanticSupportBandStampCounts counts)
    {
        ArgumentNullException.ThrowIfNull(counts);

        return counts.DecisionGradeTotal > 0 && counts.Unsupported == 0;
    }

    public static string? FormatStampSemanticSupportBandLine(
        SemanticSupportBandStampCounts counts,
        bool compact = false)
    {
        ArgumentNullException.ThrowIfNull(counts);

        if (counts.DecisionGradeTotal == 0)
        {
            return null;
        }

        List<string> segments =
        [
            FormatBandCountSegment("Supported", counts.Supported),
            FormatBandCountSegment("Unchecked", counts.Unchecked),
            FormatBandCountSegment("Unsupported", counts.Unsupported),
        ];

        if (!compact && counts.NotScored > 0)
        {
            segments.Add(FormatBandCountSegment("Not scored", counts.NotScored));
        }

        string prefix = compact
            ? "Semantic support:"
            : "Semantic support (decision-grade):";

        return $"{prefix} {string.Join(" · ", segments)}";
    }

    public static IReadOnlyList<UnsupportedSemanticSupportStampEntry> ListUnsupportedDecisionGradeSemanticSupportFindings(
        IReadOnlyList<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<UnsupportedSemanticSupportStampEntry> entries = [];

        foreach (ArchitectureFinding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            FindingSemanticSupportBand band = ResolveDecisionGradeSemanticSupportBand(finding.SemanticSupportBand);

            if (band != FindingSemanticSupportBand.Unsupported)
            {
                continue;
            }

            string title = ResolveFindingTitle(finding);
            entries.Add(new UnsupportedSemanticSupportStampEntry(finding.FindingId, title));
        }

        return entries;
    }

    public static IReadOnlyList<string> FormatStampUnsupportedSemanticSupportLabels(
        IReadOnlyList<UnsupportedSemanticSupportStampEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return entries
            .Select(static entry => $"{entry.FindingId}: {entry.Title}")
            .ToList();
    }

    private static string FormatBandCountSegment(string label, int count) =>
        $"{count.ToString(CultureInfo.InvariantCulture)} {label}";

    private static string ResolveFindingTitle(ArchitectureFinding finding)
    {
        string message = finding.Message?.Trim() ?? string.Empty;

        if (message.Length > 0)
        {
            return message.Length <= 96 ? message : string.Concat(message.AsSpan(0, 93), "...");
        }

        return finding.FindingId;
    }
}
