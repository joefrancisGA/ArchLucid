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
        if (!string.IsNullOrWhiteSpace(raw) && Enum.TryParse(raw.Trim(), true, out FindingHumanReviewStatus st))
            return st;

        return FindingHumanReviewStatus.NotRequired;
    }

    public static FindingConfidenceLevel? TryParseEvaluationConfidenceLevel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out FindingConfidenceLevel lvl) ? lvl : null;
    }
}
