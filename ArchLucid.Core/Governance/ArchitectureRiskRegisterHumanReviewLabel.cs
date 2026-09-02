using System.Globalization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Governance;

/// <summary>Buyer-facing labels for inbound-sync human review state on risk-register rows (TB-063).</summary>
public static class ArchitectureRiskRegisterHumanReviewLabel
{
    public static string Format(FindingHumanReviewStatus status)
    {
        return status switch
        {
            FindingHumanReviewStatus.NotRequired => "No human review required",
            FindingHumanReviewStatus.Pending => "Human review pending",
            FindingHumanReviewStatus.Approved => "Human review approved",
            FindingHumanReviewStatus.Rejected => "Human review rejected",
            FindingHumanReviewStatus.Overridden => "Human review overridden",
            _ => status.ToString(),
        };
    }

    public static FindingHumanReviewStatus ParseOrDefault(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingHumanReviewStatus.NotRequired;

        string trimmed = raw.Trim();

        if (TryParseWholeNumberString(trimmed, out int numeric))
        {
            if (Enum.IsDefined(typeof(FindingHumanReviewStatus), numeric))
                return (FindingHumanReviewStatus)numeric;

            return FindingHumanReviewStatus.NotRequired;
        }

        if (Enum.TryParse(trimmed, true, out FindingHumanReviewStatus status) &&
            Enum.IsDefined(typeof(FindingHumanReviewStatus), status))
            return status;

        return FindingHumanReviewStatus.NotRequired;
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
