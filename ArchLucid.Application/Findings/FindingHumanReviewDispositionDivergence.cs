using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>LP-17 / ADR 0076 — ITSM queue state vs current disposition trail honesty.</summary>
public static class FindingHumanReviewDispositionDivergence
{
    public const string ExportSuffix = " (diverged from disposition trail)";

    public static bool HasCurrentDispositionPointer(string? latestDispositionRowVersionBase64) =>
        !string.IsNullOrWhiteSpace(latestDispositionRowVersionBase64);

    public static bool IsDiverged(
        FindingHumanReviewStatus humanReviewStatus,
        FindingDisposition? latestDisposition,
        bool hasCurrentDispositionPointer)
    {
        if (!hasCurrentDispositionPointer || latestDisposition is null)
            return false;

        return humanReviewStatus switch
        {
            FindingHumanReviewStatus.Approved =>
                latestDisposition is not FindingDisposition.Remediated
                and not FindingDisposition.Accepted,
            FindingHumanReviewStatus.Rejected =>
                latestDisposition is FindingDisposition.Accepted
                or FindingDisposition.Remediated,
            FindingHumanReviewStatus.Overridden =>
                latestDisposition is not FindingDisposition.Accepted,
            _ => false,
        };
    }

    public static string FormatHumanReviewStatusForExport(
        FindingHumanReviewStatus humanReviewStatus,
        FindingDisposition? latestDisposition)
    {
        string label = humanReviewStatus.ToString();
        bool hasCurrentPointer = latestDisposition is not null;

        if (!IsDiverged(humanReviewStatus, latestDisposition, hasCurrentPointer))
            return label;

        return label + ExportSuffix;
    }
}
