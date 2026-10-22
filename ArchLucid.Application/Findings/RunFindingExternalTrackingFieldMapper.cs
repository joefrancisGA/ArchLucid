using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

internal static class RunFindingExternalTrackingFieldMapper
{
    public static FindingHumanReviewStatus ParseHumanReview(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw) && Enum.TryParse(raw.Trim(), true, out FindingHumanReviewStatus status))
            return status;

        return FindingHumanReviewStatus.NotRequired;
    }

    public static FindingDisposition? ParseDisposition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingDisposition disposition)
            ? disposition
            : null;
    }

    public static DateTimeOffset? ToUtcOffset(DateTime? raw)
    {
        if (raw is null)
            return null;

        return new DateTimeOffset(DateTime.SpecifyKind(raw.Value, DateTimeKind.Utc));
    }
}
