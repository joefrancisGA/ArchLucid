using System.Text.RegularExpressions;

using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     Resolves older vs newer pack content JSON from append-only change-log rows.
/// </summary>
public static partial class PolicyPackChangeLogVersionPairSelector
{
    public sealed record VersionTransition(
        string OlderVersionLabel,
        string OlderContentJson,
        string NewerVersionLabel,
        string NewerContentJson,
        PolicyPackChangeLogEntry NewerChangeLogEntry,
        PolicyPackChangeLogEntry? OlderChangeLogEntry);

    public static VersionTransition? TrySelectLatestTransition(IReadOnlyList<PolicyPackChangeLogEntry> entriesNewestFirst)
    {
        ArgumentNullException.ThrowIfNull(entriesNewestFirst);

        List<PolicyPackChangeLogEntry> published = entriesNewestFirst
            .Where(entry => string.Equals(entry.ChangeType, PolicyPackChangeTypes.VersionPublished, StringComparison.Ordinal))
            .ToList();

        if (published.Count == 0)
            return null;

        PolicyPackChangeLogEntry newerEntry = published[0];

        if (string.IsNullOrWhiteSpace(newerEntry.NewValue))
            return null;

        string newerVersionLabel = ExtractVersionFromSummary(newerEntry.SummaryText) ?? "current";
        string olderContentJson;
        string olderVersionLabel;
        PolicyPackChangeLogEntry? olderEntry;

        if (!string.IsNullOrWhiteSpace(newerEntry.PreviousValue))
        {
            olderContentJson = newerEntry.PreviousValue!;
            olderEntry = published.Count >= 2 ? published[1] : null;
            olderVersionLabel = olderEntry is null
                ? "previous"
                : ExtractVersionFromSummary(olderEntry.SummaryText) ?? "previous";
        }
        else if (published.Count >= 2)
        {
            olderEntry = published[1];

            if (string.IsNullOrWhiteSpace(olderEntry.NewValue))
                return null;

            olderContentJson = olderEntry.NewValue!;
            olderVersionLabel = ExtractVersionFromSummary(olderEntry.SummaryText) ?? "older";
        }
        else
        {
            return null;
        }

        return new VersionTransition(
            olderVersionLabel,
            olderContentJson,
            newerVersionLabel,
            newerEntry.NewValue!,
            newerEntry,
            olderEntry);
    }

    internal static string? ExtractVersionFromSummary(string? summaryText)
    {
        if (string.IsNullOrWhiteSpace(summaryText))
            return null;

        Match match = VersionSummaryPattern().Match(summaryText);

        if (!match.Success)
            return null;

        return match.Groups[1].Value;
    }

    [GeneratedRegex(
        @"Version\s+'([^']+)'\s+published",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex VersionSummaryPattern();
}
