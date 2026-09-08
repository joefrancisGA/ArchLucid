using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

internal static class FindingInspectReadModelMapper
{
    public static FindingSeverity ParseFindingSeverity(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingSeverity.Info;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingSeverity sev) ? sev : FindingSeverity.Info;
    }

    public static FindingHumanReviewStatus ParseHumanReview(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingHumanReviewStatus.NotRequired;

        if (!Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingHumanReviewStatus status))
            return FindingHumanReviewStatus.NotRequired;

        return Enum.IsDefined(status) ? status : FindingHumanReviewStatus.NotRequired;
    }

    public static FindingConfidenceLevel? TryParseEvaluationConfidenceLevel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingConfidenceLevel lvl) ? lvl : null;
    }

    public static FindingDisposition? ParseDisposition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (!Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingDisposition disposition))
            return null;

        return Enum.IsDefined(disposition) ? disposition : null;
    }
}
